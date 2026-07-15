import { fetchSimilarProducts } from "@/utils/action";
import ProductsGrid from "../products/ProductsGrid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  muscle: string | null;
  currentProductId: string;
}

export default async function SimilarProducts({
  muscle,
  currentProductId,
}: Props) {
  if (!muscle) return null;

  const products = await fetchSimilarProducts({
    muscle,
    excludeId: currentProductId,
    limit: 6, // Fetch more to enable scrolling (e.g., 6 items → 2 pages of 3)
  });

  if (!products.length) return null;

  const productItems = products.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: p.price,
  }));

  const session = await getServerSession(authOptions);

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold mb-6">Similar Equipment</h2>
      <ProductsGrid
        products={productItems}
        userId={session?.user?.id || null}
        favoriteMap={undefined}
      />
    </section>
  );
}
