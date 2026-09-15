"use client";

import { Button } from "../ui/button";
import { LuSearch } from "react-icons/lu";

type Props = {
  onOpen: () => void;
};

export default function Search({ onOpen }: Props) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="cursor-pointer bg-black text-white hover:bg-neutral-800 hover:text-white border-0"
      onClick={onOpen}
      aria-label="Open search"
    >
      <LuSearch className="h-6 w-6" />
    </Button>
  );
}
