"use client";

import { useSession } from "next-auth/react";
import { LuUser } from "react-icons/lu";

export default function UserIcon({ isDark }: { isDark: boolean }) {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;

  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt="User profile picture"
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }

  return (
    <LuUser
      className={`h-6 w-6 rounded-full p-1 transition-colors duration-300 ${
        isDark ? "bg-white/10 text-white" : "bg-black/10 text-neutral-900"
      }`}
    />
  );
}
