"use client";

import Logo from "./Logo";
import NavbarClient from "./NavbarClient";
import { cenlinks } from "@/utils/links";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useNavTheme } from "./Navthemecontext";

type Props = {
  numItemsInCart: number;
};

export default function NavbarShell({ numItemsInCart }: Props) {
  const { theme: sectionTheme, atTop, navRef } = useNavTheme();
  const { resolvedTheme } = useTheme();
  const globalDark = resolvedTheme === "dark";

  // Solid black bar at the very top always gets white text.
  // In global dark mode the page background is dark everywhere, so the
  // navbar always needs white text there too — the scroll-based section
  // theme only matters while the site is in light mode.
  const isDark = atTop || globalDark || sectionTheme === "dark";
  const textColor = isDark ? "text-white" : "text-neutral-900";

  return (
    <div
      ref={navRef}
      className={`relative flex items-center justify-between py-2 px-4 lg:px-8 transition-colors duration-300 ${
        atTop ? "bg-black" : "bg-transparent"
      }`}
    >
      {/* LEFT — Logo (all breakpoints) */}
      <Logo />

      {/* CENTER — Nav links, desktop only, truly centered regardless of side widths */}
      <div
        className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 tracking-wider sm:leading-loose transition-colors duration-300 ${textColor}`}
      >
        {cenlinks.map(({ href, label }) => (
          <Link key={href} href={href} className="text-sm hover:opacity-70">
            {label}
          </Link>
        ))}
      </div>

      {/* RIGHT — full icon cluster on desktop, dropdown only on tablet/mobile
          (handled inside NavbarClient's own lg breakpoint) */}
      <NavbarClient numItemsInCart={numItemsInCart} isDark={isDark} />
    </div>
  );
}
