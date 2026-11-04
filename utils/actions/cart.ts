"use server";

import db from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Cart } from "@prisma/client";
import { AppError } from "@/utils/app-error";
import { calculateCartTotals } from "@/utils/pricing";
import { getAuthUser } from "@/utils/guards";
import { MAX_ITEM_QUANTITY, isValidQuantity } from "@/utils/validation";

export const fetchOrCreateCart = async () => {
  const user = await getAuthUser();
  let cart = await db.cart.findFirst({ where: { userId: user.id } });
  if (!cart) {
    cart = await db.cart.create({ data: { userId: user.id } });
  }
  return cart;
};

export const fetchCartItems = async () => {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) return [];

  const cart = await fetchOrCreateCart();
  return db.cartItems.findMany({
    where: { cartId: cart.id },
    include: { product: true },
  });
};

export type CartActionState = {
  success: boolean;
  message: string;
};

// Result of updating or removing a cart item. `amount` is the quantity that
// was saved, so the UI can reconcile its selector with the server.
export type CartItemActionState = CartActionState & { amount?: number };

// Expected problems (for example "You must be logged in") keep their message.
// Anything else gets a generic one, so database details never reach the user.
const cartItemErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const addToCartAction = async (
  prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> => {
  try {
    const productId = formData.get("productId") as string;
    const rawAmount = formData.get("amount");
    const amount =
      rawAmount === null || rawAmount === "" ? 1 : Number(rawAmount);

    if (!productId) {
      return { success: false, message: "Product ID missing" };
    }

    if (!isValidQuantity(amount)) {
      return { success: false, message: "Invalid quantity" };
    }

    const cart = await fetchOrCreateCart();

    const existingItem = await db.cartItems.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      if (!isValidQuantity(existingItem.amount + amount)) {
        return { success: false, message: "Invalid quantity" };
      }
      await db.cartItems.update({
        where: { id: existingItem.id },
        data: { amount: existingItem.amount + amount },
      });
    } else {
      await db.cartItems.create({
        data: { cartId: cart.id, productId, amount },
      });
    }

    await updateCart(cart);

    revalidatePath("/cart");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Added to cart 🛒",
    };
  } catch {
    return {
      success: false,
      message: "Failed to add item to cart",
    };
  }
};

export const updateCartOrCreateItemAction = async ({
  amount,
  productId,
}: {
  amount: number;
  productId: string;
}) => {
  // The cart is derived from the logged-in user (this also requires a login),
  // never taken from the caller.
  const cart = await fetchOrCreateCart();

  if (!isValidQuantity(amount)) {
    throw new Error("Invalid quantity");
  }

  const product = await db.products.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    throw new Error("Product not found");
  }

  let cartItem = await db.cartItems.findFirst({
    where: {
      productId,
      cartId: cart.id,
    },
  });
  if (cartItem) {
    if (!isValidQuantity(cartItem.amount + amount)) {
      throw new Error("Invalid quantity");
    }
    cartItem = await db.cartItems.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    });
  } else {
    cartItem = await db.cartItems.create({
      data: { amount, productId, cartId: cart.id },
    });
  }

  revalidatePath("/cart");
};

// Read-only cart for rendering: never creates or updates anything. Totals are
// calculated in memory from current database prices, so a page always shows
// up-to-date amounts without writing to the database. Persisted totals are
// refreshed by the cart mutations and at checkout.
export const fetchCartForDisplay = async () => {
  const user = await getAuthUser();
  const cart = await db.cart.findFirst({
    where: { userId: user.id },
    include: { cartItems: { include: { product: true } } },
  });
  if (!cart) return null;

  const totals = calculateCartTotals(
    cart.cartItems,
    cart.taxRate,
    cart.shipping,
  );
  return { ...cart, ...totals };
};

export const updateCart = async (cart: Pick<Cart, "id">) => {
  const user = await getAuthUser();

  // Only the cart id is taken from the caller. Tax rate and shipping are read
  // from the database, and the cart must belong to the logged-in user.
  const trustedCart = await db.cart.findFirst({
    where: { id: cart.id, userId: user.id },
  });
  if (!trustedCart) {
    throw new Error("Cart not found");
  }

  const cartItems = await db.cartItems.findMany({
    where: {
      cartId: trustedCart.id,
    },
    include: {
      product: true,
    },
  });

  const { numItemsInCart, cartTotal, tax, orderTotal } = calculateCartTotals(
    cartItems,
    trustedCart.taxRate,
    trustedCart.shipping,
  );

  const updateCart = await db.cart.update({
    where: {
      id: trustedCart.id,
    },
    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
  });

  return {
    ...updateCart,
    cartItems,
  };
};

export const removeCartItemAction = async (
  formData: FormData,
): Promise<CartItemActionState> => {
  try {
    const user = await getAuthUser();

    const cartItemId = formData.get("id") as string;

    if (!cartItemId) {
      return { success: false, message: "Item not found" };
    }

    const cartItem = await db.cartItems.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    // Someone else's item gets the same answer as one that does not exist.
    if (!cartItem || cartItem.cart.userId !== user.id) {
      return { success: false, message: "Item not found" };
    }

    await db.cartItems.delete({
      where: { id: cartItemId },
    });

    await updateCart(cartItem.cart);

    revalidatePath("/cart");
    return { success: true, message: "Item removed" };
  } catch (error) {
    return {
      success: false,
      message: cartItemErrorMessage(
        error,
        "Could not remove the item. Please try again.",
      ),
    };
  }
};

export const updateCartItemAction = async (
  formData: FormData,
): Promise<CartItemActionState> => {
  try {
    const user = await getAuthUser();

    const cartItemId = formData.get("id") as string;
    const amount = Number(formData.get("amount"));

    if (!cartItemId) {
      return { success: false, message: "Item not found" };
    }

    if (!isValidQuantity(amount)) {
      return {
        success: false,
        message: `Quantity must be a whole number from 1 to ${MAX_ITEM_QUANTITY}`,
      };
    }

    // Ownership and the write happen in one statement, so there is no gap
    // between checking the item and updating it. The quantity is set, not
    // added, so simultaneous updates are safe: the last one wins.
    const updated = await db.cartItems.updateMany({
      where: { id: cartItemId, cart: { userId: user.id } },
      data: { amount },
    });

    if (updated.count === 0) {
      return { success: false, message: "Item not found" };
    }

    const cart = await fetchOrCreateCart();
    await updateCart(cart);

    revalidatePath("/cart");
    return { success: true, message: "Cart updated", amount };
  } catch (error) {
    return {
      success: false,
      message: cartItemErrorMessage(
        error,
        "Could not update the cart. Please try again.",
      ),
    };
  }
};
