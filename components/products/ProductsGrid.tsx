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
  const sc = useScreenTier();

  const screenTier = useScreenTier();

  const ITEMS_PER_PAGE =
    screenTier === "desktop" ? 3 : screenTier === "tablet" ? 2 : 1;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [products.length]);

  return (
    <div className="pt-12 space-y-8">
      {totalPages > 1 && (
        <div className="flex justify-between items-center  gap-6">
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            variant="outline"
          >
            ← Prev
          </Button>

          <Button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            variant="outline"
          >
            Next →
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
                className=" grid
  gap-6
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  place-items-center
  lg:place-items-start
"
              >
                {slideProducts.map((product) => {
                  const { id, name, price, image, favoriteId } = product;
                  const formattedPrice = formatCurrency(price);

                  return (
                    <article
                      key={id}
                      className="group relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[360px]"
                    >
                      <Link href={`/equipments/${id}`}>
                        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition hover:shadow-md">
                          {" "}
                          <div className="relative aspect-square w-full overflow-hidden bg-white">
                            {" "}
                            <Image
                              src={image}
                              alt={name}
                              fill
                              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                              className="object-contain transition-transform duration-300 group-hover:scale-105"
                            />{" "}
                          </div>{" "}
                          <div className="p-4 space-y-2 text-left">
                            {" "}
                            <h2 className="text-sm font-medium leading-snug line-clamp-2">
                              {name}
                            </h2>{" "}
                            <div className="flex items-center gap-1 text-sm text-yellow-500">
                              <span>⭐ {product.rating}</span>
                              <span className="text-gray-500">
                                (
                                {product.reviewCount
                                  ? product.reviewCount
                                  : "0"}
                                )
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">
                              {truncateWords(product.description ?? "", 8)}
                            </p>
                            <p className="pt-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                              {formattedPrice}
                            </p>
                          </div>{" "}
                        </div>
                      </Link>

                      {userId && (
                        <div
                          className="absolute top-3 right-3 z-10"
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

function truncateWords(text: string, count = 8) {
  return text.split(" ").slice(0, count).join(" ") + "…";
}
