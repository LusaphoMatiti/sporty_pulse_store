import { type NextRequest } from "next/server";
import crypto from "crypto";
import db from "@/utils/db";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID as string;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE as string;
const PAYFAST_MODE = process.env.PAYFAST_MODE ?? "sandbox"; // "sandbox" | "live"
const STORE_BRIDGE_SECRET = process.env.STORE_BRIDGE_SECRET as string;
const PRO_API_BASE_URL = (process.env.PRO_API_BASE_URL as string)?.replace(
  /\/+$/,
  "",
); // e.g. https://sportypulsepro.app -- trailing slash stripped defensively

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
 * Structured, PII-free logging for the ITN handler. Only a safe identifier
 * (the order id) and a failure category are logged -- never the request body,
 * signatures, merchant details or customer fields. String values are capped
 * because some events fire before the request has been authenticated, so the
 * order id may be attacker-supplied.
 */
const logItn = (
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | undefined> = {},
) => {
  const safe: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(details)) {
    safe[key] = typeof value === "string" ? value.slice(0, 100) : value;
  }
  console[level](JSON.stringify({ scope: "payfast_itn", event, ...safe }));
};

// Error name and code only. Messages and stacks can embed query parameters
// or customer data, so they are deliberately left out.
const errorInfo = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : "UnknownError",
  errorCode: (error as { code?: string } | null)?.code,
});

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
    logItn("error", "validate_request_failed", errorInfo(error));
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

  const expectedSignature = computeExpectedSignature(params);

  // ── 1. Signature check ─────────────────────────────────────────
  if (expectedSignature !== receivedSignature) {
    logItn("error", "signature_mismatch", { orderId });
    return new Response(null, { status: 400 });
  }

  // ── 2. Merchant ID check ───────────────────────────────────────
  if (merchantId !== PAYFAST_MERCHANT_ID) {
    logItn("error", "merchant_mismatch", { orderId });
    return new Response(null, { status: 400 });
  }

  // ── 3. Source check -- confirm this really came from PayFast ──
  const isFromPayFast = await verifyWithPayFast(rawBody);
  if (!isFromPayFast) {
    logItn("error", "source_validation_failed", { orderId });
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
      logItn("error", "order_not_found", { orderId });
      return new Response(null, { status: 404 });
    }

    // Fully processed (paid and entitlements delivered) -- PayFast can resend
    // the same ITN. A paid order whose entitlements are still undelivered
    // carries on below, so the delivery is retried.
    if (order.isPaid && order.entitlementsGrantedAt) {
      return new Response(null, { status: 200 });
    }

    // ── 5. Amount check -- protects against a tampered amount ────
    const expectedAmount = order.orderTotal.toFixed(2);
    if (amountGross !== expectedAmount) {
      logItn("error", "amount_mismatch", {
        orderId,
        expected: expectedAmount,
        received: amountGross,
      });
      return new Response(null, { status: 400 });
    }

    // ── 6. Mark the order paid (first notification only) ──────────
    if (!order.isPaid) {
      // Atomic: only one of several simultaneous ITNs can flip isPaid from
      // false to true.
      const paidUpdate = await db.order.updateMany({
        where: { id: orderId, isPaid: false },
        data: { isPaid: true },
      });
      if (paidUpdate.count === 0) {
        // Another notification for this order is already handling it.
        return new Response(null, { status: 200 });
      }

      if (order.userId) {
        // Best-effort -- don't fail the ITN if the cart is already gone.
        // Looked up from the order's owner, never from the ITN payload.
        // First notification only, so a retry never wipes a newer cart.
        await db.cart
          .deleteMany({ where: { userId: order.userId } })
          .catch(() => null);
      }
    }

    // ── 7. Deliver the entitlements via Pro's bridge ──────────────
    // Retryable: entitlementsGrantedAt is only set after Pro confirms. A
    // failure answers 500 so PayFast sends the notification again, and a
    // repeat notification skips step 6 and lands back here until delivery
    // succeeds.
    if (!PRO_API_BASE_URL || !order.email || order.orderItems.length === 0) {
      logItn("warn", "bridge_skipped", { orderId });
      return new Response(null, { status: 200 });
    }

    try {
      const bridgeResponse = await fetch(
        `${PRO_API_BASE_URL}/api/internal/entitlements/grant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STORE_BRIDGE_SECRET}`,
            // Lets Pro recognise a repeat delivery of the same order.
            "Idempotency-Key": order.id,
          },
          body: JSON.stringify({
            email: order.email,
            storeProductIds: order.orderItems.map((item) => item.productId),
          }),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!bridgeResponse.ok) {
        // fetch() does NOT throw on 4xx/5xx -- this is the only way
        // to actually catch a failed bridge call.
        logItn("error", "bridge_rejected", {
          orderId,
          status: bridgeResponse.status,
        });
        return new Response(null, { status: 500 });
      }
    } catch (bridgeError) {
      logItn("error", "bridge_call_failed", {
        orderId,
        ...errorInfo(bridgeError),
      });
      return new Response(null, { status: 500 });
    }

    // Record the delivery. Atomic, so concurrent notifications record it once.
    await db.order.updateMany({
      where: { id: orderId, entitlementsGrantedAt: null },
      data: { entitlementsGrantedAt: new Date() },
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    logItn("error", "processing_error", { orderId, ...errorInfo(error) });
    return new Response(null, { status: 500 });
  }
};
