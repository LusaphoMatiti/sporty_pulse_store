"use client";

import { clsx } from "clsx";

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("w-full px-4 sm:px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}
