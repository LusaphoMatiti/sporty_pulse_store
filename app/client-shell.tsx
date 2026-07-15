"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isPublicRoute } from "@/utils/publicRoutes";
import Container from "@/components/global/Container";
import Providers from "@/components/providers";
import SignInForm from "@/components/auth/sign-in-form";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useSession();

  return (
    <Providers>
      <Container className="py-20">
        {isPublicRoute(pathname) ? (
          children
        ) : status === "authenticated" ? (
          children
        ) : status === "loading" ? null : (
          <div className="flex justify-center mt-20">
            <SignInForm />
          </div>
        )}
      </Container>
    </Providers>
  );
}
