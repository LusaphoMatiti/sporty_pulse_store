import Logo from "./Logo";
import NavbarClient from "./NavbarClient";
import { cenlinks } from "@/utils/links";
import Link from "next/link";

type Props = {
  numItemsInCart: number;
};

export default function NavbarShell({ numItemsInCart }: Props) {
  return (
    <div className="relative flex items-center justify-between py-2 px-4 lg:px-8 bg-black">
      {/* LEFT — Logo (all breakpoints) */}
      <Logo />

      {/* CENTER — Nav links, desktop only, truly centered regardless of side widths */}
      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-white tracking-wider sm:leading-loose">
        {cenlinks.map(({ href, label }) => (
          <Link key={href} href={href} className="text-sm hover:text-gray-300">
            {label}
          </Link>
        ))}
      </div>

      {/* RIGHT — full icon cluster on desktop, dropdown only on tablet/mobile
          (handled inside NavbarClient's own lg breakpoint) */}
      <NavbarClient numItemsInCart={numItemsInCart} />
    </div>
  );
}
