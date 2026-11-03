import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Server actions in utils/action.ts: cart, order and admin access control.
// The database and the session are replaced, so nothing here touches real
// data. Run with: npx vitest run tests/cart-order-actions.test.ts
// ---------------------------------------------------------------------------

const { db, getServerSession, redirect } = vi.hoisted(() => ({
  db: {
    cart: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    cartItems: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    order: { create: vi.fn(), deleteMany: vi.fn() },
    products: { update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  getServerSession: vi.fn(),
  // Like Next.js, redirect() stops execution by throwing.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/utils/db", () => ({ default: db }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/utils/supabase", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

import {
  addToCartAction,
  createOrderAction,
  deleteProductAction,
  removeCartItemAction,
  updateCart,
  updateCartItemAction,
  updateCartOrCreateItemAction,
  updateProductAction,
} from "@/utils/action";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

const USER_A = { id: "user-a", email: "a@example.com" };
const CART_A = {
  id: "cart-a",
  userId: "user-a",
  taxRate: 0.1,
  shipping: 5,
  // Deliberately stale stored totals.
  numItemsInCart: 99,
  cartTotal: 1,
  tax: 0,
  orderTotal: 1,
};
// 2 x R500 + 1 x R200 = R1200, tax R120, shipping R5 -> R1325 (3 items).
const ITEMS_A = [
  { id: "ci-1", cartId: "cart-a", productId: "p1", amount: 2, product: { price: 500 } },
  { id: "ci-2", cartId: "cart-a", productId: "p2", amount: 1, product: { price: 200 } },
];

const signInAs = (user: { id: string; email?: string } | null) =>
  getServerSession.mockResolvedValue(user ? { user } : null);

const everyDbWrite = () => [
  db.cart.create,
  db.cart.update,
  db.cartItems.create,
  db.cartItems.update,
  db.cartItems.updateMany,
  db.cartItems.delete,
  db.order.create,
  db.order.deleteMany,
  db.products.update,
  db.products.delete,
];

beforeEach(() => {
  vi.unstubAllEnvs();
  const all = [
    ...Object.values(db.cart),
    ...Object.values(db.cartItems),
    ...Object.values(db.order),
    ...Object.values(db.products),
    db.$transaction,
  ];
  for (const fn of all) fn.mockReset();
  redirect.mockClear();
  getServerSession.mockReset();

  signInAs(USER_A);
  db.cart.findFirst.mockResolvedValue(CART_A);
  db.cart.update.mockImplementation(async ({ data }) => ({ ...CART_A, ...data }));
  db.cartItems.findMany.mockResolvedValue(ITEMS_A);
  db.order.deleteMany.mockResolvedValue({ count: 0 });
  db.order.create.mockResolvedValue({ id: "order-1" });
  db.$transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
});

describe("removing a cart item", () => {
  it("does not delete another customer's cart item", async () => {
    db.cartItems.findUnique.mockResolvedValue({
      id: "ci-x",
      cart: { id: "cart-b", userId: "user-b" },
    });

    await removeCartItemAction(form({ id: "ci-x" }));

    expect(db.cartItems.delete).not.toHaveBeenCalled();
  });

  it("requires a login", async () => {
    signInAs(null);

    await expect(removeCartItemAction(form({ id: "ci-1" }))).rejects.toThrow();

    expect(db.cartItems.findUnique).not.toHaveBeenCalled();
    expect(db.cartItems.delete).not.toHaveBeenCalled();
  });

  it("deletes the customer's own item", async () => {
    db.cartItems.findUnique.mockResolvedValue({
      id: "ci-1",
      cart: CART_A,
    });

    await removeCartItemAction(form({ id: "ci-1" }));

    expect(db.cartItems.delete).toHaveBeenCalledWith({ where: { id: "ci-1" } });
  });
});

describe("updating a cart item quantity", () => {
  it.each(["0", "-1", "1.5", "100", "abc", ""])(
    "ignores the invalid quantity %j",
    async (amount) => {
      await updateCartItemAction(form({ id: "ci-1", amount }));

      expect(db.cartItems.updateMany).not.toHaveBeenCalled();
    },
  );

  it("only updates items that belong to the logged-in customer", async () => {
    db.cartItems.updateMany.mockResolvedValue({ count: 1 });

    await updateCartItemAction(form({ id: "ci-1", amount: "3" }));

    expect(db.cartItems.updateMany).toHaveBeenCalledWith({
      where: { id: "ci-1", cart: { userId: "user-a" } },
      data: { amount: 3 },
    });
  });

  it("does nothing further when the item is not theirs", async () => {
    db.cartItems.updateMany.mockResolvedValue({ count: 0 });

    await updateCartItemAction(form({ id: "ci-x", amount: "3" }));

    expect(db.cart.update).not.toHaveBeenCalled();
  });

  it("requires a login", async () => {
    signInAs(null);

    await expect(
      updateCartItemAction(form({ id: "ci-1", amount: "2" })),
    ).rejects.toThrow();
    expect(db.cartItems.updateMany).not.toHaveBeenCalled();
  });
});

describe("adding to the cart", () => {
  it.each(["-5", "0", "1.5", "100", "abc"])(
    "rejects the invalid quantity %j",
    async (amount) => {
      db.cartItems.findFirst.mockResolvedValue(null);

      const result = await addToCartAction(
        { success: false, message: "" },
        form({ productId: "p1", amount }),
      );

      expect(result.success).toBe(false);
      expect(db.cartItems.create).not.toHaveBeenCalled();
      expect(db.cartItems.update).not.toHaveBeenCalled();
    },
  );

  it("rejects a combined quantity above the limit", async () => {
    db.cartItems.findFirst.mockResolvedValue({ id: "ci-1", amount: 98 });

    const result = await addToCartAction(
      { success: false, message: "" },
      form({ productId: "p1", amount: "5" }),
    );

    expect(result.success).toBe(false);
    expect(db.cartItems.update).not.toHaveBeenCalled();
  });

  it("adds a valid quantity to the logged-in customer's own cart", async () => {
    db.cartItems.findFirst.mockResolvedValue(null);

    const result = await addToCartAction(
      { success: false, message: "" },
      form({ productId: "p1", amount: "2" }),
    );

    expect(result.success).toBe(true);
    expect(db.cartItems.create).toHaveBeenCalledWith({
      data: { cartId: "cart-a", productId: "p1", amount: 2 },
    });
  });
});

describe("updateCartOrCreateItemAction", () => {
  it("derives the cart from the session and rejects unknown products", async () => {
    db.products.findUnique.mockResolvedValue(null);

    await expect(
      updateCartOrCreateItemAction({ amount: 1, productId: "ghost" }),
    ).rejects.toThrow("Product not found");

    expect(db.cart.findFirst).toHaveBeenCalledWith({ where: { userId: "user-a" } });
    expect(db.cartItems.create).not.toHaveBeenCalled();
  });

  it("rejects invalid quantities", async () => {
    for (const amount of [-1, 0, 1.5, 100]) {
      await expect(
        updateCartOrCreateItemAction({ amount, productId: "p1" }),
      ).rejects.toThrow("Invalid quantity");
    }
    expect(db.cartItems.create).not.toHaveBeenCalled();
  });

  it("requires a login", async () => {
    signInAs(null);

    await expect(
      updateCartOrCreateItemAction({ amount: 1, productId: "p1" }),
    ).rejects.toThrow();
  });
});

describe("recalculating a cart", () => {
  it("refuses a cart that belongs to someone else", async () => {
    db.cart.findFirst.mockResolvedValue(null); // no cart with that id for this user

    await expect(updateCart({ id: "cart-b" })).rejects.toThrow("Cart not found");

    expect(db.cart.findFirst).toHaveBeenCalledWith({
      where: { id: "cart-b", userId: "user-a" },
    });
    expect(db.cart.update).not.toHaveBeenCalled();
  });

  it("ignores any tax rate or shipping the caller tries to supply", async () => {
    // A caller passing extra fields (typed away here) must not change the maths.
    const forged = { id: "cart-a", taxRate: -5, shipping: -1000 } as never;

    await updateCart(forged);

    const { data } = db.cart.update.mock.calls[0][0];
    expect(data.tax).toBe(120);
    expect(data.orderTotal).toBe(1325);
  });
});

describe("placing an order", () => {
  const placeOrder = () => createOrderAction(form({}));

  it("recalculates from current prices instead of the stored cart totals", async () => {
    await expect(placeOrder()).rejects.toThrow("NEXT_REDIRECT:/checkout");

    const { data } = db.order.create.mock.calls[0][0];
    expect(data).toMatchObject({
      userId: "user-a",
      orderTotal: 1325,
      tax: 120,
      shipping: 5,
      products: 3,
      email: "a@example.com",
    });
    expect(data.orderItems.create).toEqual([
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ]);
  });

  it("sends the customer to checkout for the new order", async () => {
    await expect(placeOrder()).rejects.toThrow(
      "NEXT_REDIRECT:/checkout?orderId=order-1&cartId=cart-a",
    );
  });

  it("refuses an empty cart without creating or deleting anything", async () => {
    db.cartItems.findMany.mockResolvedValue([]);

    await expect(placeOrder()).rejects.toThrow("NEXT_REDIRECT:/cart");

    expect(db.order.create).not.toHaveBeenCalled();
    expect(db.order.deleteMany).not.toHaveBeenCalled();
  });

  it("only removes unpaid orders older than 7 days, in the same transaction", async () => {
    await expect(placeOrder()).rejects.toThrow("NEXT_REDIRECT");

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$transaction.mock.calls[0][0]).toHaveLength(2);

    const { where } = db.order.deleteMany.mock.calls[0][0];
    expect(where.userId).toBe("user-a");
    expect(where.isPaid).toBe(false);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(where.createdAt.lt.getTime() - sevenDaysAgo)).toBeLessThan(5000);
  });

  it("requires a login", async () => {
    signInAs(null);

    await expect(placeOrder()).rejects.toThrow();
    expect(db.order.create).not.toHaveBeenCalled();
  });
});

describe("admin-only product actions", () => {
  const edit = (price = "700") =>
    form({ id: "p1", name: "Bench", company: "Acme", description: "x", price });

  it("blocks a signed-in customer who is not the admin", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    await expect(updateProductAction({}, edit())).rejects.toThrow("NEXT_REDIRECT:/");
    await expect(
      deleteProductAction({}, form({ productId: "p1" })),
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(db.products.update).not.toHaveBeenCalled();
    expect(db.products.delete).not.toHaveBeenCalled();
  });

  it("blocks everyone when no admin email is configured", async () => {
    // Unset (not just empty), and a session with no email at all: this is the
    // case where "undefined === undefined" would otherwise make a customer admin.
    vi.stubEnv("ADMIN_EMAIL", undefined);
    signInAs({ id: "user-x" });

    await expect(updateProductAction({}, edit())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(db.products.update).not.toHaveBeenCalled();
  });

  it("also blocks everyone when the admin email is empty", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    signInAs({ id: "user-x", email: "" });

    await expect(updateProductAction({}, edit())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(db.products.update).not.toHaveBeenCalled();
  });

  it("compares the admin email exactly", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    signInAs({ id: "user-x", email: "ADMIN@example.com" });

    await expect(updateProductAction({}, edit())).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("requires a login", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    signInAs(null);

    await expect(updateProductAction({}, edit())).rejects.toThrow();
    expect(db.products.update).not.toHaveBeenCalled();
  });

  describe("as the admin", () => {
    beforeEach(() => {
      vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
      signInAs({ id: "admin-1", email: "admin@example.com" });
      db.products.update.mockResolvedValue({});
    });

    it.each(["0", "-5", "1.5", "abc", ""])(
      "rejects the invalid price %j",
      async (price) => {
        const result = await updateProductAction({}, edit(price));

        expect(result.success).toBe(false);
        expect(db.products.update).not.toHaveBeenCalled();
      },
    );

    it("saves a valid whole-number price", async () => {
      const result = await updateProductAction({}, edit("700"));

      expect(result.success).toBe(true);
      expect(db.products.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ price: 700 }) }),
      );
    });
  });
});

describe("no action writes anything without a login", () => {
  it("leaves every database write untouched", async () => {
    signInAs(null);

    await Promise.allSettled([
      removeCartItemAction(form({ id: "ci-1" })),
      updateCartItemAction(form({ id: "ci-1", amount: "2" })),
      addToCartAction({ success: false, message: "" }, form({ productId: "p1" })),
      createOrderAction(form({})),
      updateCart({ id: "cart-a" }),
      updateCartOrCreateItemAction({ amount: 1, productId: "p1" }),
    ]);

    for (const write of everyDbWrite()) expect(write).not.toHaveBeenCalled();
  });
});
