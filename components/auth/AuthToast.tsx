"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function AuthToast() {
  const { data: session, status } = useSession();
  const hasShown = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (hasShown.current) return;

    const firstName = session.user.name?.split(" ")[0];
    toast.success(
      firstName ? `Welcome back, ${firstName} 💪` : "Welcome back 💪",
    );

    hasShown.current = true;
  }, [status, session]);

  return null;
}
