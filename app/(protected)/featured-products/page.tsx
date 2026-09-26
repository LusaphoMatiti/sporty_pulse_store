import Container from "@/components/global/Container";
import Breadcrumbs from "../../../components/global/Breadcrumbs";
import SectionTitle from "@/components/global/SectionTitle";
import EmptyList from "@/components/global/EmptyList";
import ProductsGrid from "@/components/products/ProductsGrid";
import { fetchFeaturedPro } from "@/utils/action";
import { getServerUserId } from "@/utils/server/auth";
import { fetchFavoriteId } from "@/utils/server/favorite";
import Footer from "@/components/footer/Footer";

export default async function FeaturedProductsPage() {
  const userId = await getServerUserId();
  const products = await fetchFeaturedPro();

  const productsWithFavorite = await Promise.all(
    products.map(async (product) => ({
      ...product,
      favoriteId: userId ? await fetchFavoriteId(product.id) : null,
    })),
  );

  return (
    <Container className="py-5 sm:py-5">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Featured Products" }]}
      />

      <div className="pt-4">
        <SectionTitle text="Featured Products" />
        <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-600">
          Simple gear and recovery tools built for busy people who train at
          home. Here&apos;s the full lineup of what we&apos;re featuring right
          now.
        </p>
      </div>

      <div className="pt-6">
        {productsWithFavorite.length ? (
          <ProductsGrid products={productsWithFavorite} userId={userId} />
        ) : (
          <EmptyList />
        )}
      </div>
      <Footer />
    </Container>
  );
}
