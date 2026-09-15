"use client";

import Link from "next/link";
import { LuShoppingCart } from "react-icons/lu";
import { Button } from "../ui/button";
function CartButton({ numItemsInCart }: { numItemsInCart: number }) {
  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className="flex justify-center items-center relative bg-black text-white hover:bg-neutral-800 border-0 hover:text-white"
      aria-label="Cart button"
    >
      <Link href="/cart" aria-label={`Cart with ${numItemsInCart} items`}>
        <LuShoppingCart />
        <span className="absolute -top-3 text-primary-foreground bg-primary rounded-full h-6 w-6 font-bold flex justify-center items-center -right-3  text-xs border-0">
          {numItemsInCart}
        </span>
      </Link>
    </Button>
  );
}
export default CartButton;
