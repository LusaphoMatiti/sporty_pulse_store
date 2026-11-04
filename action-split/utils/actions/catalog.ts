"use server";

import db from "@/utils/db";

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
  const product = await db.products.findUnique({
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
