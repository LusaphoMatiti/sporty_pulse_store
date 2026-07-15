// app/client-shell.tsx
"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isPublicRoute } from "@/utils/publicRoutes";
import Container from "@/components/global/Container";
import SignInForm from "@/components/auth/sign-in-form";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useSession();

  return (
    <Container className="py-20">
      {isPublicRoute(pathname) ? (
        children
      ) : status === "authenticated" ? (
        children
      ) : status ===
        "loading" ? // Brief flash while the session resolves client-side.
      // In normal navigation, middleware already redirects genuinely
      // signed-out users server-side before this ever renders.
      null : (
        <div className="flex justify-center mt-20">
          <SignInForm />
        </div>
      )}
    </Container>
  );
}
