// Compatibility barrel: every server action is defined in a domain module under
// utils/actions/, and this file keeps the existing "@/utils/action" imports
// working. It deliberately has no "use server" directive: each domain module
// declares its own. New code should import from the domain module directly.
//
//   catalog    public product reads
//   admin      admin-only product and order operations (every export is guarded)
//   favorites  favorites
//   reviews    product reviews
//   cart       cart reads and mutations
//   orders     order creation and order history

export {
  fetchFeaturedPro,
  fetchAllProducts,
  fetchSingleProduct,
  fetchSingleProductWithMuscles,
  fetchProductsByMuscle,
  fetchSimilarProducts,
  fetchFilteredProducts,
  getProductById,
} from "./actions/catalog";
export {
  createProduction,
  fetchAdminProducts,
  fetchAdminProductDetails,
  deleteProductAction,
  updateProductAction,
  updateProductImageAction,
  fetchAdminOrders,
} from "./actions/admin";
export {
  fetchFavoriteId,
  toggleFavorite,
  fetchUserFavorites,
} from "./actions/favorites";
export {
  createReviewAction,
  fetchProductReviews,
  fetchProductRating,
  fetchProductReviewsByUser,
  deleteReviewAction,
  findExistingReview,
} from "./actions/reviews";
export {
  fetchOrCreateCart,
  fetchCartItems,
  addToCartAction,
  updateCartOrCreateItemAction,
  fetchCartForDisplay,
  updateCart,
  removeCartItemAction,
  updateCartItemAction,
} from "./actions/cart";
export type { CartActionState, CartItemActionState } from "./actions/cart";
export { createOrderAction, fetchUserOrders } from "./actions/orders";
export { default } from "./actions/session";
