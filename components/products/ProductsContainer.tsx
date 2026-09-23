// components/products/ProductsContainer.tsx
import { getServerUserId } from "@/utils/server/auth";
import { fetchFavoriteId } from "@/utils/server/favorite";
import { fetchAllProducts } from "@/utils/action";
import ProductsGrid from "./ProductsGrid";
import ProductsList from "./ProductsList";
import ProductsHeader from "./ProductsHeader";

export default async function ProductsContainer({
  layout,
  search,
}: {
  layout: string;
  search: string;
}) {
  const products = await fetchAllProducts({ search });
  const userId = await getServerUserId();

  // Resolve favoriteId for each product
  const productsWithFavorite = await Promise.all(
    products.map(async (product) => {
      const favoriteId = userId ? await fetchFavoriteId(product.id) : null;
      return { ...product, favoriteId };
    }),
  );

  return (
    <>
      <section data-nav-theme="light">
        <ProductsHeader totalProducts={products.length} />
        {layout === "grid" ? (
          <ProductsGrid products={productsWithFavorite} userId={userId} />
        ) : (
          <ProductsList products={productsWithFavorite} userId={userId} />
        )}
      </section>
    </>
  );
}
