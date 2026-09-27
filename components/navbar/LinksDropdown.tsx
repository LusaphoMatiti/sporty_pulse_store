"use client";

import { useState } from "react";
import { LuAlignLeft } from "react-icons/lu";
import { Button } from "../ui/button";
import UserIcon from "./UserIcon";
import MobileMenu from "./MobileMenu";

type Props = {
  isDark: boolean;
  numItemsInCart: number;
};

function LinksDropdown({ isDark, numItemsInCart }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`flex cursor-pointer gap-2 !bg-transparent transition-colors duration-300 ${
          isDark
            ? "!text-white hover:!bg-neutral-800 hover:!text-white"
            : "!text-neutral-900 hover:!bg-neutral-200 hover:!text-neutral-900"
        }`}
      >
        <LuAlignLeft className="h-6 w-6" />
        <UserIcon isDark={isDark} />
      </Button>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        numItemsInCart={numItemsInCart}
      />
    </>
  );
}

export default LinksDropdown;
