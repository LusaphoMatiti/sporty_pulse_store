import crypto from "node:crypto";

// Independent copy of PayFast's PHP urlencode() style encoding. It is kept
// separate from the route code on purpose, so a regression in the route is
// not silently copied into the tests.
export const phpUrlEncode = (value: string) =>
  encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");

export const md5 = (value: string) =>
  crypto.createHash("md5").update(value).digest("hex");

// PayFast's documented order for the outgoing checkout signature.
const CHECKOUT_FIELD_ORDER = [
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
];

/** Signature PayFast expects on the checkout form we send the customer to. */
export const expectedCheckoutSignature = (
  fields: Record<string, string>,
  passphrase: string,
) => {
  const params = CHECKOUT_FIELD_ORDER.filter(
    (key) => fields[key] !== undefined && fields[key] !== "",
  )
    .map((key) => `${key}=${phpUrlEncode(fields[key])}`)
    .join("&");
  return md5(passphrase ? `${params}&passphrase=${phpUrlEncode(passphrase)}` : params);
};

/**
 * Builds a signed ITN (payment notification) body the way PayFast sends it:
 * the signature covers the fields in the order they arrive, blank values
 * included.
 */
export const buildItnBody = (
  fields: Record<string, string>,
  passphrase: string,
) => {
  const pairs = Object.entries(fields);
  const params = pairs.map(([k, v]) => `${k}=${phpUrlEncode(v)}`).join("&");
  const signature = md5(
    passphrase ? `${params}&passphrase=${phpUrlEncode(passphrase)}` : params,
  );
  const body = new URLSearchParams(pairs);
  body.append("signature", signature);
  return { body: body.toString(), signature };
};
