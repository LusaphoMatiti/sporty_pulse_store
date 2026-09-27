"use client";

import { Input } from "../ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LuSearch } from "react-icons/lu";

type Props = {
  autoFocus?: boolean;
};

export default function NavSearch({ autoFocus }: Props) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const runSearch = () => {
    const params = new URLSearchParams(searchParams);

    if (search) params.set("search", search);
    else params.delete("search");

    replace(`/equipment?${params.toString()}`);
  };

  useEffect(() => {
    if (!searchParams.get("search")) setSearch("");
  }, [searchParams]);

  return (
    <div className="relative">
      <Input
        autoFocus={autoFocus}
        type="search"
        placeholder="Search training equipment..."
        className="h-12 text-base pr-10 text-neutral-900 dark:text-neutral-100"
        aria-label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") runSearch();
        }}
      />
      <button
        type="button"
        onClick={runSearch}
        aria-label="Run search"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
      >
        <LuSearch className="h-5 w-5" />
      </button>
    </div>
  );
}
