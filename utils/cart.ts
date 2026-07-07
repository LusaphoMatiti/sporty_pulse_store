import db from "@/utils/db";
import { getServerUser } from "@/utils/server/auth";

export async function fetchCartItems() {
  const user = await getServerUser();

  if (!user) return 0;

  const cart = await db.cart.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      numItemsInCart: true,
    },
  });

  return cart?.numItemsInCart ?? 0;
}
