"use client";

import { Button } from "../ui/button";
import { LuSearch } from "react-icons/lu";

type Props = {
  onOpen: () => void;
  isDark: boolean;
};

export default function Search({ onOpen, isDark }: Props) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onOpen}
      aria-label="Open search"
      className={`cursor-pointer border-0 bg-transparent transition-colors duration-300 ${
        isDark
          ? "text-white hover:bg-neutral-800 hover:text-white"
          : "text-neutral-900 hover:bg-neutral-200 hover:text-neutral-900"
      }`}
    >
      <LuSearch className="h-6 w-6" />
    </Button>
  );
}
