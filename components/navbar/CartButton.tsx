"use client";

import Link from "next/link";
import { LuShoppingCart } from "react-icons/lu";
import { Button } from "../ui/button";

function CartButton({
  numItemsInCart,
  isDark,
}: {
  numItemsInCart: number;
  isDark: boolean;
}) {
  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      aria-label={`Cart with ${numItemsInCart} items`}
      className={`relative flex items-center justify-center border-0 bg-transparent transition-colors duration-300 ${
        isDark
          ? "text-white hover:bg-neutral-800 hover:text-white"
          : "text-neutral-900 hover:bg-neutral-200 hover:text-neutral-900"
      }`}
    >
      <Link href="/cart">
        <LuShoppingCart className="h-6 w-6" />
        <span className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {numItemsInCart}
        </span>
      </Link>
    </Button>
  );
}
export default CartButton;
