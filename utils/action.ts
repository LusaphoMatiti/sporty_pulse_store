"use server";

import db from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  imageSchema,
  productSchema,
  reviewSchema,
  validateWithZodSchema,
} from "./schemas";
import { deleteImage, uploadImage } from "./supabase";
import { revalidatePath } from "next/cache";
import { Cart } from "@prisma/client";
import { ActionResult, AppError } from "./app-error";
import { FavoriteState } from "./app-error";
import { Products, Muscle } from "@prisma/client";
import prisma from "@/utils/db";
import { calculateCartTotals } from "./pricing";

const getAuthUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "You must be logged in");
  }
  // Shape: { id, email, name, image } -- different from Clerk's user
  // object, notably no .emailAddresses array, just a plain .email string.
  return session.user;
};

export default getAuthUser;

const getAdminUser = async () => {
  const user = await getAuthUser();
  // Now compares email rather than a hardcoded ID -- matches the same
  // change made in middleware.ts, and survives database reseeds.
  const adminEmail = process.env.ADMIN_EMAIL;
  // Fail closed: if ADMIN_EMAIL is not set, nobody is an admin. The comparison
  // is deliberately exact (case-sensitive).
  if (!adminEmail || user.email !== adminEmail) redirect("/");
  return user;
};

const renderError = (error: unknown): { message: string } => ({
  message: error instanceof Error ? error.message : "An error occurred",
});

/** PRODUCTS **/

export const fetchFeaturedPro = async () => {
  return db.products.findMany({ where: { featured: true } });
};

export const fetchAllProducts = async ({ search = "" }: { search: string }) => {
  return db.products.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
};

export const fetchSingleProduct = async (productId: string) => {
  const product = await db.products.findUnique({
    where: { id: productId },
  });

  if (!product) return null;
  // Return product + computed muscleNames
  return {
    ...product,
    muscles: name,
  };
};

export const fetchSingleProductWithMuscles = async (id: string) => {
  return db.products.findUnique({
    where: { id },
    include: {
      productMuscles: {
        include: {
          muscle: true,
        },
      },
      category: true,
    },
  });
};

export const createProduction = async (prevState: any, formData: FormData) => {
  const user = await getAdminUser();

  try {
    const rawData = Object.fromEntries(formData.entries());
    const muscleIds = formData.getAll("muscleIds") as string[];
    const rawCategory = formData.get("category") as string;
    const muscleGroup = formData.get("muscle") as string;

    const file = formData.get("image") as File;
    if (!(file instanceof File)) {
      return { success: false, message: "Image is required" };
    }

    if (!rawCategory || !["fitness", "recovery"].includes(rawCategory)) {
      return {
        success: false,
        message: "Category is required and must be fitness or recovery",
      };
    }

    const validatedFields = validateWithZodSchema(productSchema, rawData);
    if (!validatedFields.success) {
      return { success: false, message: validatedFields.message };
    }

    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    if (!validatedFile.success) {
      return { success: false, message: validatedFile.message };
    }

    const fullPath = await uploadImage(validatedFile.data.image);
    const { muscle, ...safeData } = validatedFields.data;

    await db.products.create({
      data: {
        ...safeData,
        image: fullPath,
        userId: user.id,

        // simple string column
        muscle: muscleGroup,

        // connectOrCreate for Category (safe)
        category: {
          connectOrCreate: {
            where: {
              name: rawCategory, // because name is @unique in Category model
            },
            create: {
              name: rawCategory,
            },
          },
        },

        // connectOrCreate for muscles (composite unique)
        productMuscles: {
          create: muscleIds.map((id) => ({
            muscle: {
              connect: { id }, // safe because id is primary key
            },
          })),
        },
      },
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product created successfully" };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Body exceeded 1 MB limit")
    ) {
      return { success: false, message: "File size must be less than 1 MB" };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    };
  }
};

export const fetchAdminProducts = async () => {
  await getAdminUser();
  return db.products.findMany({ orderBy: { createdAt: "desc" } });
};

export const fetchAdminProductDetails = async (productId: string) => {
  await getAdminUser();
  const product = await db.products.findUnique({ where: { id: productId } });
  if (!product) redirect("/admin/products");
  return product;
};

export const deleteProductAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const productId = formData.get("productId") as string;
    if (!productId) {
      return { success: false, message: "Product ID missing" };
    }

    const product = await db.products.delete({
      where: { id: productId },
    });
    await deleteImage(product.image);
    revalidatePath("/admin/products");
    return { success: true, message: "Product removed" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
};

export const updateProductAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const featured = formData.has("featured");

    if (!Number.isInteger(price) || price < 1) {
      return {
        success: false,
        message: "Price must be a whole number of at least 1",
      };
    }

    await db.products.update({
      where: { id },
      data: { name, company, description, price, featured },
    });
    revalidatePath(`/admin/products/${id}/edit`);
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
};

export const updateProductImageAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const image = formData.get("image") as File;
    const productId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    if (!validatedFile.success)
      return {
        success: false,
        message: "Invalid file: " + validatedFile.message,
      };

    const fullPath = await uploadImage(validatedFile.data.image);
    await deleteImage(oldImageUrl);
    await db.products.update({
      where: { id: productId },
      data: { image: fullPath },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, message: "Product image updated successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

/** FAVORITES **/

export const fetchFavoriteId = async ({ productId }: { productId: string }) => {
  const user = await getAuthUser();
  const favorite = await db.favorite.findFirst({
    where: { productId, userId: user.id },
    select: { id: true },
  });
  return favorite?.id || null;
};

export const toggleFavorite = async (
  prevState: FavoriteState,
  formData: FormData,
): Promise<FavoriteState> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "You must be logged in",
      favoriteId: prevState.favoriteId,
    };
  }

  const productId = String(formData.get("productId"));
  const favoriteIdRaw = formData.get("favoriteId");
  const favoriteId =
    favoriteIdRaw && favoriteIdRaw !== "" ? String(favoriteIdRaw) : null;

  try {
    if (favoriteId) {
      await db.favorite.delete({ where: { id: favoriteId } });

      return {
        success: true,
        favoriteId: null,
        message: "Removed from favorites",
      };
    }
    const favorite = await db.favorite.create({
      data: { productId, userId },
    });

    return {
      success: true,
      message: "Added to favorites",
      favoriteId: favorite.id,
    };
  } catch {
    return {
      success: false,
      code: "UNKNOWN",
      message: "Something went wrong.",
      favoriteId: prevState.favoriteId,
    };
  }
};

export const fetchUserFavorites = async () => {
  const user = await getAuthUser();
  return db.favorite.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
};

/** REVIEWS **/

export const createReviewAction = async (
  prevState: any,
  formData: FormData,
) => {
  const user = await getAuthUser();
  try {
    const rawData = Object.fromEntries(formData);
    const validated = validateWithZodSchema(reviewSchema, rawData);
    if (!validated.success) throw new Error(validated.message);

    await db.review.create({ data: { ...validated.data, userId: user.id } });
    revalidatePath(`/products/${validated.data.productId}`);
    return { success: true, message: "Review submitted successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to submit review",
    };
  }
};

export const fetchProductReviews = async (productId: string) =>
  db.review.findMany({ where: { productId }, orderBy: { createdAt: "desc" } });

export const fetchProductRating = async (productId: string) => {
  const result = await db.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { rating: true },
    where: { productId },
  });
  return {
    rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
    count: result[0]?._count.rating ?? 0,
  };
};

export const fetchProductReviewsByUser = async () => {
  const user = await getAuthUser();
  return db.review.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      rating: true,
      comment: true,
      product: { select: { image: true, name: true } },
    },
  });
};

export const deleteReviewAction = async (prevState: { reviewId: string }) => {
  const user = await getAuthUser();
  try {
    await db.review.delete({
      where: { id: prevState.reviewId, userId: user.id },
    });
    revalidatePath("/reviews");
    return { success: true, message: "Review deleted successfully" };
  } catch (error) {
    const err = renderError(error);
    return { success: false, message: err.message };
  }
};

export const findExistingReview = async (userId: string, productId: string) =>
  db.review.findFirst({ where: { userId, productId } });

/** CART **/

const MAX_ITEM_QUANTITY = 99;

const isValidQuantity = (quantity: number) =>
  Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_ITEM_QUANTITY;

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

const fetchProduct = async (productId: string) => {
  const product = await db.products.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
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

export const fetchAdminOrders = async () => {
  await getAdminUser();

  const orders = await db.order.findMany({
    where: {
      isPaid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders;
};

export const removeCartItemAction = async (formData: FormData) => {
  const user = await getAuthUser();

  const cartItemId = formData.get("id") as string;

  if (!cartItemId) {
    return;
  }

  const cartItem = await db.cartItems.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem) return;

  if (cartItem.cart.userId !== user.id) return;

  await db.cartItems.delete({
    where: { id: cartItemId },
  });

  await updateCart(cartItem.cart);

  revalidatePath("/cart");
};

export const updateCartItemAction = async (formData: FormData) => {
  const user = await getAuthUser();

  const cartItemId = formData.get("id") as string;
  const amount = Number(formData.get("amount"));

  if (!cartItemId || !isValidQuantity(amount)) return;

  // Ownership and the write happen in one statement, so there is no gap
  // between checking the item and updating it. The quantity is set, not
  // added, so simultaneous updates are safe: the last one wins.
  const updated = await db.cartItems.updateMany({
    where: { id: cartItemId, cart: { userId: user.id } },
    data: { amount },
  });

  if (updated.count === 0) return;

  const cart = await fetchOrCreateCart();
  await updateCart(cart);

  revalidatePath("/cart");
};

// action.ts
export const fetchProductsByMuscle = async (muscle: string) => {
  return db.products.findMany({
    where: { muscle },
    orderBy: { createdAt: "desc" },
    include: { reviews: true },
  });
};

export const fetchSimilarProducts = async ({
  muscle,
  excludeId,
  limit = 4,
}: {
  muscle: string;
  excludeId: string;
  limit?: number;
}) => {
  return db.products.findMany({
    where: {
      muscle,
      NOT: { id: excludeId },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
};

// filtering products

type Props = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  sort?: string;
};

export const fetchFilteredProducts = async ({
  search = "",
  minPrice,
  maxPrice,
  category,
  sort,
}: Props) => {
  return db.products.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        minPrice ? { price: { gte: minPrice } } : {},
        maxPrice ? { price: { lte: maxPrice } } : {},
        // Was `{ muscle: category }`, which only matched the single scalar
        // field -- meant a product could ever appear on ONE category page,
        // no matter how many badges it had in productMuscles. Filtering
        // through the join table instead means a product shows up on
        // every category page for which it has a matching muscle badge
        // (e.g. Resistance Bands, tagged with Chest/Legs/Core/etc, now
        // correctly appears on upper-body, lower-body, and core pages).
        category
          ? {
              productMuscles: {
                some: {
                  muscle: { category },
                },
              },
            }
          : {},
      ],
    },

    orderBy:
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : sort === "popular"
              ? { reviews: { _count: "desc" } }
              : { createdAt: "desc" },
  });
};

export const getProductById = async (id: string) => {
  const product = await prisma?.products.findUnique({
    where: { id },
    include: {
      productMuscles: {
        include: {
          muscle: true,
        },
      },
    },
  });

  return product;
};
