"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-switch";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider disableTransitionOnChange>{children}</ThemeProvider>
    </SessionProvider>
  );
}
