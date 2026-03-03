"use server";

import db from "@/utils/db";
import { currentUser, auth } from "@clerk/nextjs/server";
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

const getAuthUser = async () => {
  const user = await currentUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "You must be logged in");
  }
  return user;
};

export default getAuthUser;

const getAdminUser = async () => {
  const user = await getAuthUser();
  if (user.id !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) redirect("/");
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
    // Do NOT include 'muscles' — it doesn't exist as a relation
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
  const user = await getAuthUser();

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
        clerkId: user.id,

        // simple string column
        muscle: muscleGroup,

        // ✅ connectOrCreate for Category (safe)
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

        // ✅ connectOrCreate for muscles (composite unique)
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
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const featured = formData.has("featured");

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
  await getAuthUser();
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
    where: { productId, clerkId: user.id },
    select: { id: true },
  });
  return favorite?.id || null;
};

export const toggleFavorite = async (
  prevState: FavoriteState,
  formData: FormData,
): Promise<FavoriteState> => {
  const { userId } = await auth();

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
      data: { productId, clerkId: userId },
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
    where: { clerkId: user.id },
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

    await db.review.create({ data: { ...validated.data, clerkId: user.id } });
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
    where: { clerkId: user.id },
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
      where: { id: prevState.reviewId, clerkId: user.id },
    });
    revalidatePath("/reviews");
    return { success: true, message: "Review deleted successfully" };
  } catch (error) {
    const err = renderError(error);
    return { success: false, message: err.message };
  }
};

export const findExistingReview = async (userId: string, productId: string) =>
  db.review.findFirst({ where: { clerkId: userId, productId } });

/** CART **/

export const fetchOrCreateCart = async () => {
  const user = await getAuthUser();
  let cart = await db.cart.findFirst({ where: { clerkId: user.id } });
  if (!cart) {
    cart = await db.cart.create({ data: { clerkId: user.id } });
  }
  return cart;
};

export const fetchCartItems = async () => {
  const user = await currentUser().catch(() => null);
  if (!user) return [];

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
    const amount = Number(formData.get("amount")) || 1;

    if (!productId) {
      return { success: false, message: "Product ID missing" };
    }

    const cart = await fetchOrCreateCart();

    const existingItem = await db.cartItems.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
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
  cartId,
  amount,
  productId,
}: {
  cartId: string;
  amount: number;
  productId: string;
}) => {
  let cartItem = await db.cartItems.findFirst({
    where: {
      productId,
      cartId,
    },
  });
  if (cartItem) {
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
      data: { amount, productId, cartId },
    });
  }

  revalidatePath("/cart");
};

export const updateCart = async (cart: Cart) => {
  const cartItems = await db.cartItems.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
  });

  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }
  const tax = cart.taxRate * cartTotal;
  const shipping = cartTotal ? cart.shipping : 0;
  const orderTotal = cartTotal + tax + shipping;

  const updateCart = await db.cart.update({
    where: {
      id: cart.id,
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

export const createOrderAction = async (formData: FormData) => {
  const user = await getAuthUser();
  const cart = await fetchOrCreateCart();

  await db.order.deleteMany({
    where: { clerkId: user.id, isPaid: false },
  });

  const order = await db.order.create({
    data: {
      clerkId: user.id,
      products: cart.numItemsInCart,
      orderTotal: cart.orderTotal,
      tax: cart.tax,
      shipping: cart.shipping,
      email: user.emailAddresses[0]?.emailAddress || "no-email@example.com",
    },
  });

  redirect(`/checkout?orderId=${order.id}&cartId=${cart.id}`);
};

export const fetchUserOrders = async () => {
  const user = await getAuthUser();
  const orders = await db.order.findMany({
    where: {
      clerkId: user.id,
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
  const cartItemId = formData.get("id") as string;

  if (!cartItemId) {
    return;
  }

  const cartItem = await db.cartItems.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem) return;

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

  if (!cartItemId || !amount || amount < 1) return;

  const cartItem = await db.cartItems.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem) return;

  if (cartItem.cart.clerkId !== user.id) return;

  await db.cartItems.update({
    where: { id: cartItemId },
    data: { amount },
  });

  await updateCart(cartItem.cart);

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
        category ? { muscle: category } : {},
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

export const attachMusclesToProduct = async (
  productId: string,
  muscleIds: string[],
) => {
  await db.products.update({
    where: { id: productId },
    data: {
      productMuscles: {
        create: muscleIds.map((id) => ({
          muscle: {
            connect: { id },
          },
        })),
      },
    },
  });
};
