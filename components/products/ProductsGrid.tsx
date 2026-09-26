"use client";

import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import Image from "next/image";
import FavoriteToggleButtonClient from "./FavoriteToggleButtonClient";

export type ProductItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  description?: string | null;
  favoriteId?: string | null;
};

type ProductsGridProps = {
  products: ProductItem[];
  userId: string | null;
  favoriteMap?: Record<string, string | null>;
  limit?: number;
};

const ITEMS_TO_SHOW = 4;

const ProductsGrid = ({ products, userId, limit }: ProductsGridProps) => {
  const visibleProducts = limit ? products.slice(0, limit) : products;

  return (
    <section data-nav-theme="light">
      <div className="pt-4 pb-6">
        {limit && products.length > limit && (
          <div className="w-full text-right mb-3">
            <Link
              href="/featured-products"
              className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              View all →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {visibleProducts.map((product) => {
            const { id, name, price, image, favoriteId } = product;
            const formattedPrice = formatCurrency(price);

            return (
              <article key={id} className="group relative">
                <Link href={`/equipments/${id}`}>
                  <div className="relative w-full aspect-square lg:aspect-[4/3] overflow-hidden  bg-neutral-200 dark:bg-neutral-900">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      sizes="(max-width:1023px) 50vw, 25vw"
                      className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.03] "
                    />
                  </div>

                  <div className="pt-2 space-y-1 text-left">
                    <h2 className="text-base font-medium leading-snug text-neutral-900 line-clamp-1 sm:text-lg lg:text-sm xl:text-sm dark:text-neutral-100">
                      {name}
                    </h2>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-neutral-900 sm:text-base lg:text-xs xl:text-xs dark:text-neutral-100">
                        {formattedPrice}
                      </p>

                      {typeof product.rating === "number" && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {product.rating.toFixed(1)} (
                          {product.reviewCount ?? 0})
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductsGrid;
