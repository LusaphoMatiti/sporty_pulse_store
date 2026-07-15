"use client";

import { useSession } from "next-auth/react";
import { LuUser } from "react-icons/lu";

export default function UserIcon() {
  const { data: session } = useSession();

  const profileImage = session?.user?.image;

  if (profileImage) {
    return (
      <img
        src={profileImage}
        className="w-6 h-6 rounded-full object-cover"
        alt="User profile picture"
      />
    );
  }

  return (
    <LuUser
      size={50}
      className="w-6 h-6 bg-gray-300 dark:bg-gray-600 text-white rounded-full p-1"
    />
  );
}
