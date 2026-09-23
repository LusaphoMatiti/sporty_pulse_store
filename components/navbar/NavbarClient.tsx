"use client";

import LinksDropdown from "./LinksDropdown";
import CartButton from "./CartButton";
import ModeToggle from "../ModeToggle";
import Search from "./SearchIcon";
import { useState } from "react";
import SearchOverlay from "./SearchOverlay";

type Props = {
  numItemsInCart: number;
  isDark: boolean;
};

export default function NavbarClient({ numItemsInCart, isDark }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const textColor = isDark ? "text-white" : "text-neutral-900";

  return (
    <div className="flex gap-3 items-center">
      <div className={`hidden lg:flex items-center gap-3 transition-colors duration-300 ${textColor}`}>
        <Search onOpen={() => setSearchOpen(true)} isDark={isDark} />
        <CartButton numItemsInCart={numItemsInCart} isDark={isDark} />
        <ModeToggle isDark={isDark} />
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className={`transition-colors duration-300 ${textColor}`}>
        <LinksDropdown isDark={isDark} />
      </div>
    </div>
  );
}