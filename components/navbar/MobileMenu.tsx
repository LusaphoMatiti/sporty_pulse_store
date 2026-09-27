"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { LuX, LuChevronDown } from "react-icons/lu";
import { Button } from "../ui/button";
import ModeToggle from "../ModeToggle";
import Logo from "./Logo";
import CartButton from "./CartButton";
import SignOutLink from "./SignOutLink";
import NavSearch from "./NavSearch";
import { links } from "@/utils/links";

type Props = {
  open: boolean;
  onClose: () => void;
  numItemsInCart: number;
};

// Upper-body confirmed at /category/upper-body.
// Lower-body and Fullbody follow the same hyphenated pattern here
// but aren't confirmed yet — check against your actual routes.
const EQUIPMENT_LINKS = [
  { label: "Upper-body", href: "/category/upper-body" },
  { label: "Lower-body", href: "/category/lower-body" },
  { label: "Fullbody", href: "/category/full-body" },
  { label: "Core", href: "/category/core" },
];

export default function MobileMenu({ open, onClose, numItemsInCart }: Props) {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isSignedIn = status === "authenticated";
  const globalDark = resolvedTheme === "dark";

  const hrefFor = (label: string) =>
    links.find((l) => l.label === label)?.href ?? "#";

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const linkClass =
    "block py-3 text-base capitalize tracking-wide text-neutral-900 dark:text-neutral-100";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header: logo left, cart + close right */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <Logo />

        <div className="flex items-center gap-2 shrink-0">
          <CartButton numItemsInCart={numItemsInCart} isDark={globalDark} />
          <ModeToggle isDark={globalDark} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 shrink-0 text-neutral-900 dark:text-neutral-100"
          >
            <LuX className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <NavSearch />
        </div>

        {isSignedIn && (
          <nav className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
            <Link
              href={hrefFor("favorites")}
              onClick={onClose}
              className={linkClass}
            >
              Favorites
            </Link>
            <Link
              href={hrefFor("reviews")}
              onClick={onClose}
              className={linkClass}
            >
              Reviews
            </Link>
            <Link
              href={hrefFor("cart")}
              onClick={onClose}
              className={linkClass}
            >
              Cart
            </Link>
            <Link
              href={hrefFor("orders")}
              onClick={onClose}
              className={linkClass}
            >
              Orders
            </Link>

            {/* Equipment — expandable */}
            <div>
              <button
                onClick={() => setEquipmentOpen((v) => !v)}
                className="flex w-full items-center justify-between py-3 text-base capitalize tracking-wide text-neutral-900 dark:text-neutral-100"
              >
                Equipment
                <LuChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    equipmentOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {equipmentOpen && (
                <div className="flex flex-col gap-1 pb-3 pl-4">
                  {EQUIPMENT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="py-2 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <Link
                href={hrefFor("dashboard")}
                onClick={onClose}
                className={linkClass}
              >
                Dashboard
              </Link>
            )}

            <div className="py-3">
              <SignOutLink />
            </div>
          </nav>
        )}
      </div>

      {/* Bottom bar — Login / Register, only when signed out */}
      {!isSignedIn && (
        <div className="flex gap-3 border-t border-neutral-200 dark:border-neutral-800 px-4 py-4">
          <Button asChild className="flex-1">
            <Link href="/sign-in" onClick={onClose}>
              Login
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/sign-up" onClick={onClose}>
              Register
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
