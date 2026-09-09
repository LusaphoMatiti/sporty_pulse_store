import { formatCurrency } from "@/utils/format";
import Link from "next/link";
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
    <div className="mt-12 divide-y divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {products.map((product) => {
        const { name, price, image, company, id, favoriteId } = product;
        const formattedPrice = formatCurrency(price);

        return (
          <article key={id} className="group relative">
            <Link
              href={`/products/${id}`}
              className="flex items-center gap-6 py-6 pr-14 md:gap-10"
            >
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden bg-neutral-50 md:h-36 md:w-36 dark:bg-neutral-900">
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes="(max-width:768px) 112px, 144px"
                  className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-medium text-neutral-900 dark:text-neutral-100">
                  {name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {company}
                </p>
              </div>

              <p className="flex-shrink-0 text-base text-neutral-900 dark:text-neutral-100">
                {formattedPrice}
              </p>
            </Link>

            {userId && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                onClick={(e) => e.stopPropagation()}
              >
                <FavoriteToggleButtonClient
                  userId={userId}
                  favoriteId={favoriteId}
                  productId={id}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default ProductsList;
