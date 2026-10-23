import { type NextRequest } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/utils/db";

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID as string;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY as string;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE as string;
const PAYFAST_MODE = process.env.PAYFAST_MODE ?? "sandbox"; // "sandbox" | "live"

// Canonical public URL of the store, used for PayFast's return / cancel /
// notify URLs. Server-configured only, never derived from request headers,
// which the caller controls. Validated here: it must parse as a URL, and live
// payments require https. Only the origin is kept, so a trailing slash or a
// path on NEXTAUTH_URL cannot leak into the payment URLs.
const getAppBaseUrl = () => {
  const raw = process.env.NEXTAUTH_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (PAYFAST_MODE === "live" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};
const APP_BASE_URL = getAppBaseUrl();

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

// PayFast expects PHP urlencode() behaviour. encodeURIComponent() alone
// isn't enough -- it leaves !'()*~ unescaped, but PHP's urlencode()
// escapes all of them, and spaces become '+' rather than %20.
const payfastEncode = (value: string) =>
  encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");

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

  if (!APP_BASE_URL) {
    console.error(
      "NEXTAUTH_URL is missing or invalid (live mode requires https) -- cannot build PayFast URLs",
    );
    return Response.json(null, {
      status: 500,
      statusText: "Internal Server Error",
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(null, { status: 401, statusText: "Unauthorized" });
  }

  // Only the order id is taken from the request body.
  const { orderId } = await req.json();

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: true } } },
    });

    // Someone else's order gets the same 404 as one that doesn't exist.
    if (!order || order.userId !== session.user.id) {
      return Response.json(null, { status: 404, statusText: "Not Found" });
    }

    // Never start a second payment for an order that is already paid.
    if (order.isPaid) {
      return Response.json(null, {
        status: 409,
        statusText: "Order already paid",
      });
    }

    // The cart comes from the order's owner, never from the request body.
    const cart = await db.cart.findFirst({ where: { userId: order.userId } });

    if (!cart) {
      return Response.json(null, { status: 404, statusText: "Not Found" });
    }

    // Recalculate the checkout amount from the order's own items at current
    // database prices, using the same rules as updateCart() in
    // utils/action.ts (keep the two in sync). Anything that does not match
    // exactly is refused, so a stale or wrongly stored total is never charged.
    const hasInvalidQuantity = order.orderItems.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
    );
    const subtotal = order.orderItems.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );
    const expectedTotal =
      subtotal +
      Math.round(cart.taxRate * subtotal) +
      (subtotal ? cart.shipping : 0);

    if (
      hasInvalidQuantity ||
      subtotal < 1 ||
      order.orderTotal !== expectedTotal
    ) {
      console.error("PayFast checkout: order total mismatch", {
        orderId,
        storedTotal: order.orderTotal,
        expectedTotal,
      });
      return Response.json(null, {
        status: 409,
        statusText: "Order total is out of date",
      });
    }

    // PayFast charges per-transaction, not per line item -- one combined
    // description covering the whole order, taken from the order's own items.
    const itemName =
      order.orderItems.length === 1
        ? order.orderItems[0].product.name
        : `Sporty Pulse Store order (${order.orderItems.length} items)`;

    // NOTE: order.orderTotal is stored in whole Rand (see updateCart()),
    // not cents -- unlike the old Stripe route, which multiplied by 100
    // only at the point of calling Stripe's API. Do NOT divide here.
    const fields: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      // return_url is browser-only -- no order mutation happens here.
      return_url: `${APP_BASE_URL}/orders`,
      cancel_url: `${APP_BASE_URL}/cart`,
      // notify_url is the only thing allowed to mark this order as paid.
      notify_url: `${APP_BASE_URL}/api/payfast/notify`,
      email_address: order.email,
      m_payment_id: orderId,
      amount: order.orderTotal.toFixed(2),
      item_name: itemName,
      // Carried through so the ITN handler knows which cart to clean up.
      custom_str1: cart.id,
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
