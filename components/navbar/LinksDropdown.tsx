"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LuAlignLeft } from "react-icons/lu";
import { links } from "@/utils/links";
import { Button } from "../ui/button";
import UserIcon from "./UserIcon";
import Link from "next/link";
import SignOutLink from "./SignOutLink";

function LinksDropdown({ isDark }: { isDark: boolean }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isSignedIn = status === "authenticated";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex cursor-pointer gap-2 !bg-transparent transition-colors duration-300 ${
            isDark
              ? "!text-white hover:!bg-neutral-800 hover:!text-white"
              : "!text-neutral-900 hover:!bg-neutral-200 hover:!text-neutral-900"
          }`}
        >
          <LuAlignLeft className="h-6 w-6" />
          <UserIcon isDark={isDark} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-40 rounded-md shadow-lg"
        align="start"
        sideOffset={10}
      >
        {!isSignedIn ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/sign-in" className="w-full text-left">
                Login
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sign-up" className="w-full text-left">
                Register
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            {links.map((link) => {
              if (link.label === "dashboard" && !isAdmin) return null;
              return (
                <DropdownMenuItem
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="w-full cursor-pointer capitalize tracking-wider sm:leading-loose"
                >
                  {link.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="border-gray-200 dark:border-gray-700" />
            <DropdownMenuItem>
              <SignOutLink />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LinksDropdown;
