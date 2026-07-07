"use server";

import { getServerUserId } from "./auth";
import db from "@/utils/db";

export async function fetchFavoriteId(productId: string) {
  try {
    const userId = await getServerUserId();
    if (!userId) return null;

    const favorite = await db.favorite.findFirst({
      where: {
        productId,
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    return favorite?.id ?? null;
  } catch (error) {
    console.error("Error fetching favorite:", error);
    return null;
  }
}

export type FavoriteState = {
  success: boolean;
  message: string;
  favoriteId: string | null;
};

export async function toggleFavorite(
  prevState: FavoriteState,
  formData: FormData,
): Promise<FavoriteState> {
  const userId = await getServerUserId();

  if (!userId) {
    return {
      success: false,
      message: "Not authenticated",
      favoriteId: prevState.favoriteId,
    };
  }

  const productId = formData.get("productId") as string;
  const favoriteId = formData.get("favoriteId") as string | null;

  try {
    if (favoriteId) {
      await db.favorite.delete({ where: { id: favoriteId } });

      return {
        success: true,
        message: "Removed from favorites",
        favoriteId: null,
      };
    }

    const newFavorite = await db.favorite.create({
      data: {
        productId,
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      message: "Added to favorites",
      favoriteId: newFavorite.id,
    };
  } catch (error) {
    console.error("Toggle favorite error:", error);

    return {
      success: false,
      message: "An error occurred",
      favoriteId: prevState.favoriteId,
    };
  }
}
