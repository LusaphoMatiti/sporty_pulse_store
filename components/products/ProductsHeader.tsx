"use client";

import { Button } from "@/components/ui/button";
import { LuLayoutGrid, LuList } from "react-icons/lu";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Separator } from "../ui/separator";

type ProductsHeaderProps = {
  totalProducts: number;
};

export default function ProductsHeader({ totalProducts }: ProductsHeaderProps) {
  const searchParams = useSearchParams();
  const layout = searchParams.get("layout") || "grid";
  const search = searchParams.get("search") || "";
  const searchTerm = search ? `&search=${search}` : "";

  return (
    <>
      <section data-nav-theme="light">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-lg">
              {totalProducts} product{totalProducts > 1 && "s"}
            </h4>
          </div>

          <div className="flex gap-x-4">
            <Button
              size="icon"
              asChild
              className={
                layout === "grid"
                  ? "bg-primary dark:text-black"
                  : "bg-muted text-black dark:text-white hover:text-white"
              }
            >
              <Link href={`/products?layout=grid${searchTerm}`}>
                <LuLayoutGrid />
              </Link>
            </Button>

            <Button
              size="icon"
              asChild
              className={
                layout === "list"
                  ? "bg-primary dark:text-black"
                  : "bg-muted text-black dark:text-white hover:text-white"
              }
            >
              <Link href={`/products?layout=list${searchTerm}`}>
                <LuList />
              </Link>
            </Button>
          </div>
        </div>
        <Separator className="my-6 bg-gray-300 h-[1.5px]" />
      </section>
    </>
  );
}
