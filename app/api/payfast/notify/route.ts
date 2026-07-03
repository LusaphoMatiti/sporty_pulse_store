import { type NextRequest } from "next/server";
import crypto from "crypto";
import db from "@/utils/db";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID as string;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE as string;
const PAYFAST_MODE = process.env.PAYFAST_MODE ?? "sandbox"; // "sandbox" | "live"
const STORE_BRIDGE_SECRET = process.env.STORE_BRIDGE_SECRET as string;
const PRO_API_BASE_URL = process.env.PRO_API_BASE_URL as string; // e.g. https://sportypulsepro.app

const PAYFAST_VALIDATE_URL =
  PAYFAST_MODE === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";

// Matches the encoding used in the initiate route -- must fully replicate
// PHP urlencode() behaviour, not just encodeURIComponent().
const payfastEncode = (value: string) =>
  encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");

/**
 * Rebuilds the signature from the ITN payload using the ORDER THE FIELDS
 * ARRIVED IN (not the fixed checkout field order -- that's only for the
 * outgoing checkout request). PayFast decides the order it sends fields
 * back in, so we just exclude 'signature' and reuse whatever order we
 * received, which URLSearchParams preserves reliably.
 */
const computeExpectedSignature = (params: URLSearchParams) => {
  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "signature") continue;
    // NOTE: do NOT skip blank values here -- PayFast includes them
    // (e.g. "item_description=") in their own ITN signature computation.
    // Skipping blank values is only correct for the outgoing checkout
    // request, where we simply never include unused fields at all.
    pairs.push(`${key}=${payfastEncode(value)}`);
  }

  const paramString = pairs.join("&");
  const withPassphrase = PAYFAST_PASSPHRASE
    ? `${paramString}&passphrase=${payfastEncode(PAYFAST_PASSPHRASE)}`
    : paramString;

  return crypto.createHash("md5").update(withPassphrase).digest("hex");
};

/**
 * Confirms with PayFast's own servers that this ITN genuinely came from
 * them -- PayFast's recommended alternative to manually checking source IPs,
 * which is fragile in a serverless environment.
 */
const verifyWithPayFast = async (rawBody: string) => {
  try {
    const response = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = await response.text();
    return text.trim() === "VALID";
  } catch (error) {
    console.error("PayFast validate-endpoint check failed:", error);
    return false;
  }
};

export const POST = async (req: NextRequest) => {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const receivedSignature = params.get("signature") ?? "";
  const merchantId = params.get("merchant_id") ?? "";
  const paymentStatus = params.get("payment_status") ?? "";
  const orderId = params.get("m_payment_id") ?? "";
  const amountGross = params.get("amount_gross") ?? "";
  const cartId = params.get("custom_str1") ?? "";

  const expectedSignature = computeExpectedSignature(params);

  // TEMPORARY -- remove once signature issues are confirmed resolved.
  // Safe to log: PayFast's ITN payload never includes merchant_key.
  console.log("PayFast ITN debug:", {
    rawBody,
    receivedSignature,
    expectedSignature,
    merchantIdReceived: merchantId,
    merchantIdExpected: PAYFAST_MERCHANT_ID,
    hasPassphraseSet: Boolean(PAYFAST_PASSPHRASE),
  });

  // ── 1. Signature check ─────────────────────────────────────────
  if (expectedSignature !== receivedSignature) {
    console.error("PayFast ITN: signature mismatch", {
      orderId,
      expectedSignature,
      receivedSignature,
    });
    return new Response(null, { status: 400 });
  }

  // ── 2. Merchant ID check ───────────────────────────────────────
  if (merchantId !== PAYFAST_MERCHANT_ID) {
    console.error("PayFast ITN: merchant ID mismatch", {
      orderId,
      merchantIdReceived: merchantId,
      merchantIdExpected: PAYFAST_MERCHANT_ID,
    });
    return new Response(null, { status: 400 });
  }

  // ── 3. Source check -- confirm this really came from PayFast ──
  const isFromPayFast = await verifyWithPayFast(rawBody);
  if (!isFromPayFast) {
    console.error("PayFast ITN: failed source validation", { orderId });
    return new Response(null, { status: 400 });
  }

  // ── 4. Only proceed on a completed payment ─────────────────────
  if (paymentStatus !== "COMPLETE") {
    // Not an error -- PayFast also sends ITNs for other statuses.
    return new Response(null, { status: 200 });
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      console.error("PayFast ITN: no matching order", { orderId });
      return new Response(null, { status: 404 });
    }

    // Already processed -- PayFast can resend the same ITN.
    if (order.isPaid) {
      return new Response(null, { status: 200 });
    }

    // ── 5. Amount check -- protects against a tampered amount ────
    const expectedAmount = order.orderTotal.toFixed(2);
    if (amountGross !== expectedAmount) {
      console.error("PayFast ITN: amount mismatch", {
        orderId,
        expected: expectedAmount,
        received: amountGross,
      });
      return new Response(null, { status: 400 });
    }

    // ── 6. Mark the order paid ────────────────────────────────────
    await db.order.update({
      where: { id: orderId },
      data: { isPaid: true },
    });

    if (cartId) {
      // Best-effort -- don't fail the ITN if the cart is already gone.
      await db.cart.delete({ where: { id: cartId } }).catch(() => null);
    }

    // ── 7. Call Pro's bridge so it can unlock the matching equipment ─
    if (order.email && order.orderItems.length > 0 && PRO_API_BASE_URL) {
      try {
        await fetch(`${PRO_API_BASE_URL}/api/internal/entitlements/grant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STORE_BRIDGE_SECRET}`,
          },
          body: JSON.stringify({
            email: order.email,
            storeProductIds: order.orderItems.map((item) => item.productId),
          }),
        });
      } catch (bridgeError) {
        // Order is still marked paid -- don't fail the whole ITN over
        // this. Log it for now; a retry queue is a post-showcase item.
        console.error("Failed to call Pro's entitlement bridge:", bridgeError);
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("PayFast ITN processing error:", error);
    return new Response(null, { status: 500 });
  }
};
