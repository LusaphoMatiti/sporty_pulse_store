import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectedCheckoutSignature } from "./helpers/payfast";

// ---------------------------------------------------------------------------
// POST /api/payment -- starts a PayFast payment for an order.
// The database and the session are replaced, so nothing here touches real
// data. Run with: npx vitest run tests/payment-route.test.ts
// ---------------------------------------------------------------------------

const { db, getServerSession } = vi.hoisted(() => ({
  db: {
    order: { findUnique: vi.fn() },
    cart: { findFirst: vi.fn() },
  },
  getServerSession: vi.fn(),
}));

vi.mock("@/utils/db", () => ({ default: db }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const BASE_ENV: Record<string, string> = {
  PAYFAST_MERCHANT_ID: "10000100",
  PAYFAST_MERCHANT_KEY: "merchant-key",
  PAYFAST_PASSPHRASE: "test-passphrase",
  PAYFAST_MODE: "sandbox",
  NEXTAUTH_URL: "https://shop.example.com",
};

// The route reads its configuration when the module loads, so each test loads
// a fresh copy with the environment it needs.
const loadRoute = async (env: Record<string, string> = {}) => {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...env })) {
    vi.stubEnv(key, value);
  }
  return (await import("@/app/api/payment/route")).POST;
};

const request = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://shop.example.com/api/payment", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as never;

// 2 x R500 + 1 x R200 = R1200 subtotal, 10% tax = R120, R5 shipping = R1325.
const makeOrder = (over: Record<string, unknown> = {}) => ({
  id: "order-1",
  userId: "user-1",
  email: "buyer@example.com",
  isPaid: false,
  orderTotal: 1325,
  orderItems: [
    { quantity: 2, product: { name: "Bench", price: 500 } },
    { quantity: 1, product: { name: "Mat", price: 200 } },
  ],
  ...over,
});
const CART = { id: "cart-1", userId: "user-1", taxRate: 0.1, shipping: 5 };

beforeEach(() => {
  vi.unstubAllEnvs();
  db.order.findUnique.mockReset();
  db.cart.findFirst.mockReset();
  getServerSession.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  getServerSession.mockResolvedValue({ user: { id: "user-1" } });
  db.order.findUnique.mockResolvedValue(makeOrder());
  db.cart.findFirst.mockResolvedValue(CART);
});

describe("access control", () => {
  it("rejects a request with no session and reads nothing", async () => {
    getServerSession.mockResolvedValue(null);
    const POST = await loadRoute();

    const res = await POST(request({ orderId: "order-1" }));

    expect(res.status).toBe(401);
    expect(db.order.findUnique).not.toHaveBeenCalled();
  });

  it("answers 404 for another customer's order, with no payment fields", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ userId: "someone-else" }));
    const POST = await loadRoute();

    const res = await POST(request({ orderId: "order-1" }));

    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("signature");
  });

  it("answers the same 404 for an order that does not exist", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "nope" }))).status).toBe(404);
  });

  it("looks up the cart from the order's owner, never from the request", async () => {
    const POST = await loadRoute();

    await POST(request({ orderId: "order-1", cartId: "a-victims-cart" }));

    expect(db.cart.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });
});

describe("order state and totals", () => {
  it("refuses to start a second payment for an already paid order", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ isPaid: true }));
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(409);
  });

  it("refuses an order whose stored total is wrong", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ orderTotal: 1 }));
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(409);
  });

  it("refuses a stale total after a product's price changed", async () => {
    db.order.findUnique.mockResolvedValue(
      makeOrder({
        orderItems: [
          { quantity: 2, product: { name: "Bench", price: 600 } }, // was 500
          { quantity: 1, product: { name: "Mat", price: 200 } },
        ],
      }),
    );
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(409);
  });

  it("refuses an order with a negative quantity even if its total adds up", async () => {
    // 3 x 500 + (-1 x 400) = 1100, tax 110, shipping 5 -> 1215 (self-consistent)
    db.order.findUnique.mockResolvedValue(
      makeOrder({
        orderTotal: 1215,
        orderItems: [
          { quantity: 3, product: { name: "Bench", price: 500 } },
          { quantity: -1, product: { name: "Mat", price: 400 } },
        ],
      }),
    );
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(409);
  });

  it("refuses an order with no items", async () => {
    db.order.findUnique.mockResolvedValue(
      makeOrder({ orderTotal: 0, orderItems: [] }),
    );
    const POST = await loadRoute();

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(409);
  });
});

describe("what is sent to PayFast", () => {
  it("charges the verified order total with a correct signature", async () => {
    const POST = await loadRoute();

    const res = await POST(request({ orderId: "order-1" }));
    const { actionUrl, fields } = await res.json();

    expect(res.status).toBe(200);
    expect(actionUrl).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(fields.amount).toBe("1325.00");
    expect(fields.m_payment_id).toBe("order-1");
    expect(fields.item_name).toBe("Sporty Pulse Store order (2 items)");

    const { signature, ...signed } = fields;
    expect(signature).toBe(expectedCheckoutSignature(signed, "test-passphrase"));
  });

  it("builds callback URLs from configuration, ignoring the Origin header", async () => {
    const POST = await loadRoute();

    const res = await POST(
      request({ orderId: "order-1" }, { origin: "https://evil.example" }),
    );
    const { fields } = await res.json();

    expect(fields.notify_url).toBe("https://shop.example.com/api/payfast/notify");
    expect(fields.return_url).toBe("https://shop.example.com/orders");
    expect(fields.cancel_url).toBe("https://shop.example.com/cart");
    expect(JSON.stringify(fields)).not.toContain("evil.example");
  });

  it("only keeps the origin of a configured URL that has a path", async () => {
    const POST = await loadRoute({ NEXTAUTH_URL: "https://shop.example.com/api/auth/" });

    const { fields } = await (await POST(request({ orderId: "order-1" }))).json();

    expect(fields.notify_url).toBe("https://shop.example.com/api/payfast/notify");
  });
});

describe("configuration failures", () => {
  it("fails with 500 when the store URL is not configured", async () => {
    const POST = await loadRoute({ NEXTAUTH_URL: "" });

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(500);
  });

  it("fails with 500 when live payments are configured with plain http", async () => {
    const POST = await loadRoute({
      PAYFAST_MODE: "live",
      NEXTAUTH_URL: "http://shop.example.com",
    });

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(500);
  });

  it("fails with 500 when PayFast credentials are missing", async () => {
    const POST = await loadRoute({ PAYFAST_MERCHANT_ID: "" });

    expect((await POST(request({ orderId: "order-1" }))).status).toBe(500);
  });
});
