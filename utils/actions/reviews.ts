"use server";

import db from "@/utils/db";
import { reviewSchema, validateWithZodSchema } from "@/utils/schemas";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/utils/guards";

const renderError = (error: unknown): { message: string } => ({
  message: error instanceof Error ? error.message : "An error occurred",
});

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
