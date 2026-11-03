import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildItnBody } from "./helpers/payfast";

// ---------------------------------------------------------------------------
// POST /api/payfast/notify -- PayFast's payment notification (ITN) handler.
// The database is a small in-memory stand-in with the same atomic "update
// only if still unpaid" behaviour as the real queries, and fetch() is replaced
// for PayFast's validate endpoint and Pro's entitlement bridge.
// Run with: npx vitest run tests/payfast-notify.test.ts
// ---------------------------------------------------------------------------

type OrderRow = {
  id: string;
  userId: string;
  email: string;
  isPaid: boolean;
  orderTotal: number;
  entitlementsGrantedAt: Date | null;
  orderItems: { productId: string; quantity: number }[];
};

const { db, state } = vi.hoisted(() => {
  const state = {
    order: null as OrderRow | null,
    cartDeletes: [] as unknown[],
  };
  const db = {
    order: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.order && state.order.id === where.id
          ? structuredClone(state.order)
          : null,
      // Mirrors the real conditional updates: only the caller that still sees
      // the old value wins (count 1); everyone else gets count 0.
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        const order = state.order;
        if (!order || order.id !== where.id) return { count: 0 };
        if ("isPaid" in where && order.isPaid !== where.isPaid) {
          return { count: 0 };
        }
        if (
          "entitlementsGrantedAt" in where &&
          where.entitlementsGrantedAt === null &&
          order.entitlementsGrantedAt !== null
        ) {
          return { count: 0 };
        }
        Object.assign(order, data);
        return { count: 1 };
      },
    },
    cart: {
      deleteMany: async (args: unknown) => {
        state.cartDeletes.push(args);
        return { count: 1 };
      },
    },
  };
  return { db, state };
});

vi.mock("@/utils/db", () => ({ default: db }));

const PASSPHRASE = "test-passphrase";
const BRIDGE_SECRET = "bridge-secret";
const ENV: Record<string, string> = {
  PAYFAST_MERCHANT_ID: "10000100",
  PAYFAST_PASSPHRASE: PASSPHRASE,
  PAYFAST_MODE: "sandbox",
  STORE_BRIDGE_SECRET: BRIDGE_SECRET,
  PRO_API_BASE_URL: "https://pro.example.com/",
};

const freshOrder = (): OrderRow => ({
  id: "order-1",
  userId: "user-1",
  email: "buyer@example.com",
  isPaid: false,
  orderTotal: 1325,
  entitlementsGrantedAt: null,
  orderItems: [
    { productId: "product-1", quantity: 2 },
    { productId: "product-2", quantity: 1 },
  ],
});

// What PayFast would send for a completed R1325.00 payment.
const itnFields = (over: Record<string, string> = {}) => ({
  m_payment_id: "order-1",
  pf_payment_id: "1234567",
  payment_status: "COMPLETE",
  item_name: "Sporty Pulse Store order",
  item_description: "",
  amount_gross: "1325.00",
  amount_fee: "-30.49",
  amount_net: "1294.51",
  custom_str1: "cart-in-the-payload",
  name_first: "Jane",
  name_last: "Buyer",
  email_address: "buyer@example.com",
  merchant_id: "10000100",
  ...over,
});

const notification = (body: string) =>
  new Request("https://shop.example.com/api/payfast/notify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  }) as never;

const signedNotification = (over: Record<string, string> = {}) =>
  notification(buildItnBody(itnFields(over), PASSPHRASE).body);

type FetchHandler = (url: string) => Promise<Response>;
let bridgeBehaviour: () => Promise<Response>;
let validateReply: string;
let fetchMock: ReturnType<typeof vi.fn>;

const bridgeCalls = () =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes("entitlements/grant"));

const loadRoute = async () => {
  vi.resetModules();
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  return (await import("@/app/api/payfast/notify/route")).POST;
};

const consoleOutput = () =>
  (["log", "info", "warn", "error"] as const)
    .flatMap((level) =>
      vi.mocked(console[level]).mock.calls.map((call) => call.map(String).join(" ")),
    )
    .join("\n");

beforeEach(() => {
  vi.unstubAllEnvs();
  state.order = freshOrder();
  state.cartDeletes = [];
  validateReply = "VALID";
  bridgeBehaviour = async () => new Response(null, { status: 200 });
  fetchMock = vi.fn<FetchHandler>(async (url) => {
    if (String(url).includes("/eng/query/validate")) return new Response(validateReply);
    if (String(url).includes("entitlements/grant")) return bridgeBehaviour();
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  for (const level of ["log", "info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation(() => {});
  }
});

describe("rejecting notifications that cannot be trusted", () => {
  it("rejects an unsigned or wrongly signed notification and changes nothing", async () => {
    const POST = await loadRoute();
    const body = new URLSearchParams(itnFields());
    body.append("signature", "0".repeat(32));

    const res = await POST(notification(body.toString()));

    expect(res.status).toBe(400);
    expect(state.order?.isPaid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a notification whose amount was changed after signing", async () => {
    const POST = await loadRoute();
    const { body } = buildItnBody(itnFields(), PASSPHRASE);

    const res = await POST(notification(body.replace("1325.00", "1.00")));

    expect(res.status).toBe(400);
    expect(state.order?.isPaid).toBe(false);
  });

  it("rejects a correctly signed notification for a different merchant", async () => {
    const POST = await loadRoute();

    const res = await POST(signedNotification({ merchant_id: "99999999" }));

    expect(res.status).toBe(400);
    expect(state.order?.isPaid).toBe(false);
  });

  it("rejects a notification PayFast's own validation does not confirm", async () => {
    validateReply = "INVALID";
    const POST = await loadRoute();

    const res = await POST(signedNotification());

    expect(res.status).toBe(400);
    expect(state.order?.isPaid).toBe(false);
    expect(bridgeCalls()).toHaveLength(0);
  });

  it("rejects a paid amount that differs from the order total", async () => {
    const POST = await loadRoute();

    const res = await POST(signedNotification({ amount_gross: "1.00" }));

    expect(res.status).toBe(400);
    expect(state.order?.isPaid).toBe(false);
    expect(bridgeCalls()).toHaveLength(0);
  });

  it("does nothing for statuses other than COMPLETE", async () => {
    const POST = await loadRoute();

    const res = await POST(signedNotification({ payment_status: "CANCELLED" }));

    expect(res.status).toBe(200);
    expect(state.order?.isPaid).toBe(false);
    expect(bridgeCalls()).toHaveLength(0);
  });

  it("answers 404 for an unknown order", async () => {
    const POST = await loadRoute();

    const res = await POST(signedNotification({ m_payment_id: "no-such-order" }));

    expect(res.status).toBe(404);
  });
});

describe("a successful payment", () => {
  it("marks the order paid, delivers access once and records the delivery", async () => {
    const POST = await loadRoute();

    const res = await POST(signedNotification());

    expect(res.status).toBe(200);
    expect(state.order?.isPaid).toBe(true);
    expect(state.order?.entitlementsGrantedAt).toBeInstanceOf(Date);

    expect(bridgeCalls()).toHaveLength(1);
    const [url, init] = bridgeCalls()[0] as [string, RequestInit];
    expect(url).toBe("https://pro.example.com/api/internal/entitlements/grant");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${BRIDGE_SECRET}`);
    expect(headers["Idempotency-Key"]).toBe("order-1");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "buyer@example.com",
      storeProductIds: ["product-1", "product-2"],
    });
  });

  it("clears the buyer's cart by the order's owner, not by the notification's payload", async () => {
    const POST = await loadRoute();

    await POST(signedNotification());

    expect(state.cartDeletes).toEqual([{ where: { userId: "user-1" } }]);
    expect(JSON.stringify(state.cartDeletes)).not.toContain("cart-in-the-payload");
  });
});

describe("duplicate notifications", () => {
  it("handles a repeated notification without a second delivery or cart wipe", async () => {
    const POST = await loadRoute();

    await POST(signedNotification());
    const second = await POST(signedNotification());

    expect(second.status).toBe(200);
    expect(bridgeCalls()).toHaveLength(1);
    expect(state.cartDeletes).toHaveLength(1);
  });

  it("delivers exactly once when two notifications arrive at the same time", async () => {
    const POST = await loadRoute();

    const [a, b] = await Promise.all([
      POST(signedNotification()),
      POST(signedNotification()),
    ]);

    expect([a.status, b.status]).toEqual([200, 200]);
    expect(bridgeCalls()).toHaveLength(1);
    expect(state.cartDeletes).toHaveLength(1);
    expect(state.order?.isPaid).toBe(true);
  });
});

describe("failed downstream delivery", () => {
  it("answers 500 when Pro rejects the call, keeping the order paid and undelivered", async () => {
    bridgeBehaviour = async () => new Response("nope", { status: 503 });
    const POST = await loadRoute();

    const res = await POST(signedNotification());

    expect(res.status).toBe(500);
    expect(state.order?.isPaid).toBe(true);
    expect(state.order?.entitlementsGrantedAt).toBeNull();
  });

  it("answers 500 when Pro cannot be reached, keeping the order paid and undelivered", async () => {
    bridgeBehaviour = async () => {
      throw new Error("connect ETIMEDOUT");
    };
    const POST = await loadRoute();

    const res = await POST(signedNotification());

    expect(res.status).toBe(500);
    expect(state.order?.isPaid).toBe(true);
    expect(state.order?.entitlementsGrantedAt).toBeNull();
  });

  it("retries delivery on the next notification without re-marking paid or wiping a newer cart", async () => {
    bridgeBehaviour = async () => new Response(null, { status: 503 });
    const POST = await loadRoute();
    await POST(signedNotification()); // first attempt fails
    expect(state.cartDeletes).toHaveLength(1);

    bridgeBehaviour = async () => new Response(null, { status: 200 }); // Pro recovers
    const retry = await POST(signedNotification());

    expect(retry.status).toBe(200);
    expect(bridgeCalls()).toHaveLength(2);
    expect(state.order?.entitlementsGrantedAt).toBeInstanceOf(Date);
    expect(state.cartDeletes).toHaveLength(1); // not deleted a second time
  });

  it("does not call Pro again once delivery has been recorded", async () => {
    bridgeBehaviour = async () => new Response(null, { status: 503 });
    const POST = await loadRoute();
    await POST(signedNotification());
    bridgeBehaviour = async () => new Response(null, { status: 200 });
    await POST(signedNotification());

    await POST(signedNotification()); // third notification

    expect(bridgeCalls()).toHaveLength(2);
  });
});

describe("logging", () => {
  it("never logs signatures, personal details or secrets", async () => {
    const POST = await loadRoute();
    const { body, signature } = buildItnBody(itnFields(), PASSPHRASE);

    // A bad signature, a delivery failure and a bad amount.
    await POST(notification(body.replace(signature, "f".repeat(32))));
    bridgeBehaviour = async () => new Response("secret body", { status: 500 });
    await POST(signedNotification());
    state.order = freshOrder();
    await POST(signedNotification({ amount_gross: "1.00" }));

    const output = consoleOutput();
    expect(output).toContain("payfast_itn");
    expect(output).toContain("order-1");
    for (const secret of [
      signature,
      "f".repeat(32),
      "buyer@example.com",
      "Jane",
      PASSPHRASE,
      BRIDGE_SECRET,
      "secret body",
    ]) {
      expect(output).not.toContain(secret);
    }
  });
});
