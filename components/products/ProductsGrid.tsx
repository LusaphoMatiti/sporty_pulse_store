"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import Image from "next/image";
import FavoriteToggleButtonClient from "./FavoriteToggleButtonClient";
import { Button } from "../ui/button";

function useScreenTier() {
  const [tier, setTier] = useState<"mobile" | "tablet" | "desktop">("mobile");

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 639px)");
    const mqTablet = window.matchMedia(
      "(min-width: 640px) and (max-width: 1023px)",
    );
    const mqDesktop = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (mqDesktop.matches) setTier("desktop");
      else if (mqTablet.matches) setTier("tablet");
      else setTier("mobile");
    };

    update();

    mqMobile.addEventListener("change", update);
    mqTablet.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);

    return () => {
      mqMobile.removeEventListener("change", update);
      mqTablet.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
    };
  }, []);

  return tier;
}

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
};

const ProductsGrid = ({ products, userId }: ProductsGridProps) => {
  const [page, setPage] = useState(0);
  const screenTier = useScreenTier();

  const ITEMS_PER_PAGE =
    screenTier === "desktop" ? 3 : screenTier === "tablet" ? 2 : 1;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [products.length]);

  return (
    <div className="pt-10 space-y-10">
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            variant="outline"
            size="icon"
            aria-label="Previous products"
            className="rounded-none border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:bg-transparent hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
          >
            ←
          </Button>

          <Button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            variant="outline"
            size="icon"
            aria-label="Next products"
            className="rounded-none border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:bg-transparent hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
          >
            →
          </Button>
        </div>
      )}

      {/* SLIDER VIEWPORT */}
      <div className="overflow-hidden">
        {/* SLIDER TRACK */}
        <div
          className="grid grid-flow-col auto-cols-[100%] transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${page * 100}%)`,
          }}
        >
          {/* SLIDES */}
          {Array.from({ length: totalPages }).map((_, slideIndex) => {
            const slideProducts = products.slice(
              slideIndex * ITEMS_PER_PAGE,
              slideIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
            );

            return (
              <div
                key={slideIndex}
                className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
              >
                {slideProducts.map((product) => {
                  const { id, name, price, image, favoriteId } = product;
                  const formattedPrice = formatCurrency(price);

                  return (
                    <article key={id} className="group relative">
                      <Link href={`/equipments/${id}`}>
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-50 dark:bg-neutral-900">
                          <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                            className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="pt-4 space-y-1.5 text-left">
                          <h2 className="text-sm font-medium leading-snug text-neutral-900 line-clamp-2 sm:text-base dark:text-neutral-100">
                            {name}
                          </h2>

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-neutral-900 sm:text-base dark:text-neutral-100">
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

                      {userId && (
                        <div
                          className="absolute right-3 top-3 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteToggleButtonClient
                            userId={userId}
                            favoriteId={favoriteId ?? null}
                            productId={id}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductsGrid;
