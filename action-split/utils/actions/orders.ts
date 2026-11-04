"use server";

import db from "@/utils/db";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/utils/guards";
import { fetchOrCreateCart, updateCart } from "@/utils/actions/cart";

// Unpaid-order policy: an unpaid order is kept for 7 days, so a payment that
// is still in progress (or a delayed PayFast notification) can always find its
// order. Older unpaid orders are removed when that customer places a new
// order. Paid orders are never touched here.
const UNPAID_ORDER_RETENTION_DAYS = 7;

export const createOrderAction = async (formData: FormData) => {
  const user = await getAuthUser();
  const cart = await fetchOrCreateCart();

  // Recalculate from current database prices instead of trusting the totals
  // stored on the Cart row. updateCart() returns the fresh totals together
  // with the items they were calculated from.
  const freshCart = await updateCart(cart);

  if (freshCart.cartItems.length === 0 || freshCart.numItemsInCart < 1) {
    redirect("/cart");
  }

  const unpaidCutoff = new Date(
    Date.now() - UNPAID_ORDER_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  // One transaction: removing the expired unpaid orders and creating the new
  // order succeed or fail together.
  const [, order] = await db.$transaction([
    db.order.deleteMany({
      where: {
        userId: user.id,
        isPaid: false,
        createdAt: { lt: unpaidCutoff },
      },
    }),
    db.order.create({
      data: {
        userId: user.id,
        products: freshCart.numItemsInCart,
        orderTotal: freshCart.orderTotal,
        tax: freshCart.tax,
        shipping: freshCart.shipping,
        email: user.email || "no-email@example.com",
        orderItems: {
          create: freshCart.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.amount,
          })),
        },
      },
    }),
  ]);

  redirect(`/checkout?orderId=${order.id}&cartId=${cart.id}`);
};

export const fetchUserOrders = async () => {
  const user = await getAuthUser();
  const orders = await db.order.findMany({
    where: {
      userId: user.id,
      isPaid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders;
};
