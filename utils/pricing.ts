// Single source of truth for the cart price rules. Pure functions only (no
// database, no session), so server actions and pages share the same maths.
// All amounts are whole Rand.

type PricedItem = { amount: number; product: { price: number } };

export const calculateCartTotals = (
  items: PricedItem[],
  taxRate: number,
  shipping: number,
) => {
  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of items) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }

  const tax = Math.round(taxRate * cartTotal);
  const appliedShipping = cartTotal ? shipping : 0;
  const orderTotal = cartTotal + tax + appliedShipping;

  return {
    numItemsInCart,
    cartTotal,
    tax,
    shipping: appliedShipping,
    orderTotal,
  };
};
