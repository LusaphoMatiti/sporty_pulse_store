import EmptyState from "@/components/global/EmptyState";
import SectionTitle from "@/components/global/SectionTitle";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import ProductsGrid from "@/components/products/ProductsGrid";
import BreadCrumbs from "@/components/single-product/BreadCrumbs";
import { fetchUserFavorites } from "@/utils/action";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const favorites = await fetchUserFavorites();

  if (favorites.length === 0)
    return (
      <EmptyState
        title="You have no favorites yet."
        description="Add your favorite equipment and view them here."
      />
    );

  const productMap = new Map<string, any>();
  for (const fav of favorites) {
    if (fav.product) {
      if (!productMap.has(fav.product.id)) {
        productMap.set(fav.product.id, {
          id: fav.product.id,
          name: fav.product.name,
          image: fav.product.image,
          price: fav.product.price,
          favoriteId: fav.id,
        });
      }
    }
  }

  const uniqueProducts = Array.from(productMap.values());

  return (
    <>
      <MarketingLayout>
        <BreadCrumbs />
        <div>
          <SectionTitle text="Favorites" />
          <ProductsGrid userId={userId} products={uniqueProducts} />
        </div>
      </MarketingLayout>
    </>
  );
}
