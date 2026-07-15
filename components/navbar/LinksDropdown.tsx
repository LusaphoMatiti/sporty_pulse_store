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

function LinksDropdown() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // NEXT_PUBLIC_ prefix required here since this runs client-side --
  // matches how the original admin check was also exposed this way.
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isSignedIn = status === "authenticated";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex gap-4 max-w-[100px]  cursor-pointer"
          aria-label="User menu"
        >
          <LuAlignLeft className="w-6 h-6 " />
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-40 shadow-lg rounded-md"
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
                  className="capitalize w-full cursor-pointer tracking-wider sm:leading-loose "
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
