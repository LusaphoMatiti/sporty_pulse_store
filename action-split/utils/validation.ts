// Shared input rules for server actions. Pure functions only: no database,
// no session. This file has no "use server" directive, so nothing in it is a
// public endpoint.

export const MAX_ITEM_QUANTITY = 99;

export const isValidQuantity = (quantity: number) =>
  Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_ITEM_QUANTITY;

// Product prices are whole Rand amounts of at least 1.
export const isValidPrice = (price: number) =>
  Number.isInteger(price) && price >= 1;
