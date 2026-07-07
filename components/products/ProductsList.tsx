import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import FavoriteToggleButtonClient from "./FavoriteToggleButtonClient";

type ProductWithFavorite = {
  id: string;
  name: string;
  company: string;
  description: string;
  featured: boolean;
  image: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  favoriteId: string | null;
};

type ProductsListProps = {
  products: ProductWithFavorite[];
  userId: string | null;
};

const ProductsList = ({ products, userId }: ProductsListProps) => {
  return (
    <div className="mt-12 grid gap-y-8">
      {products.map((product) => {
        const { name, price, image, company, id, favoriteId } = product;
        const dollarsAmount = formatCurrency(price);

        return (
          <article key={id} className="group relative">
            <Link href={`/products/${id}`}>
              <Card className="transform group-hover:shadow-xl transition-shadow duration">
                <CardContent className="p-8 gap-y-4 grid md:grid-cols-3">
                  <div className="relative h-64 md:h-48 md:w-48">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                      priority
                      className="w-full rounded object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold capitalize">{name}</h2>
                    <h4 className="text-muted-foreground">{company}</h4>
                  </div>
                  <p className="text-muted-foreground text-lg md:ml-auto">
                    {dollarsAmount}
                  </p>
                </CardContent>
              </Card>
            </Link>
            <div className="absolute bottom-8 right-8 z-10 bg-white border-2 border-gray-300 rounded-lg p-1">
              <FavoriteToggleButtonClient
                userId={userId}
                favoriteId={favoriteId}
                productId={id}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ProductsList;
