import { type NextRequest } from "next/server";
import crypto from "crypto";
import db from "@/utils/db";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID as string;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY as string;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE as string;
const PAYFAST_MODE = process.env.PAYFAST_MODE ?? "sandbox"; // "sandbox" | "live"

const PAYFAST_PROCESS_URL =
  PAYFAST_MODE === "live"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";

// PayFast's classic checkout signature requires fields in this exact
// order -- confirmed against PayFast's own SDK repo. Do not reorder.
const SIGNATURE_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
] as const;

// PayFast expects PHP urlencode() behaviour: spaces become '+', not %20.
const payfastEncode = (value: string) =>
  encodeURIComponent(value.trim()).replace(/%20/g, "+");

const buildSignature = (fields: Record<string, string>) => {
  const paramString = SIGNATURE_FIELD_ORDER.filter(
    (key) => fields[key] !== undefined && fields[key] !== "",
  )
    .map((key) => `${key}=${payfastEncode(fields[key])}`)
    .join("&");

  const withPassphrase = PAYFAST_PASSPHRASE
    ? `${paramString}&passphrase=${payfastEncode(PAYFAST_PASSPHRASE)}`
    : paramString;

  return crypto.createHash("md5").update(withPassphrase).digest("hex");
};

export const POST = async (req: NextRequest) => {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    console.error("PayFast credentials are not set");
    return Response.json(null, {
      status: 500,
      statusText: "Internal Server Error",
    });
  }

  const requestHeaders = new Headers(req.headers);
  const origin = requestHeaders.get("origin");

  const { orderId, cartId } = await req.json();

  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: { cartItems: { include: { product: true } } },
    });

    if (!order || !cart) {
      return Response.json(null, { status: 404, statusText: "Not Found" });
    }

    // PayFast charges per-transaction, not per line item -- one combined
    // description covering the whole order.
    const itemName =
      cart.cartItems.length === 1
        ? cart.cartItems[0].product.name
        : `Sporty Pulse Store order (${cart.cartItems.length} items)`;

    // NOTE: order.orderTotal is stored in whole Rand (see updateCart()),
    // not cents -- unlike the old Stripe route, which multiplied by 100
    // only at the point of calling Stripe's API. Do NOT divide here.
    const fields: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      // return_url is browser-only -- no order mutation happens here.
      return_url: `${origin}/orders`,
      cancel_url: `${origin}/cart`,
      // notify_url is the only thing allowed to mark this order as paid.
      notify_url: `${origin}/api/payfast/notify`,
      email_address: order.email,
      m_payment_id: orderId,
      amount: order.orderTotal.toFixed(2),
      item_name: itemName,
      // Carried through so the ITN handler knows which cart to clean up.
      custom_str1: cartId,
    };

    const signature = buildSignature(fields);

    return Response.json({
      actionUrl: PAYFAST_PROCESS_URL,
      fields: { ...fields, signature },
    });
  } catch (error) {
    // This is the line to watch in your server logs / Vercel Functions log.
    console.error("PayFast checkout initiation failed:", error);
    return Response.json(
      { error: "Could not initiate PayFast checkout" },
      { status: 500 },
    );
  }
};
