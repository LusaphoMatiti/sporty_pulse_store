"use server";

import db from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FavoriteState } from "@/utils/app-error";
import { getAuthUser } from "@/utils/guards";

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
