"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

const SignOutLink = () => {
  const handleLogout = () => {
    toast.success("Logout successful");
    signOut({ callbackUrl: "/" });
  };

  return (
    <button onClick={handleLogout} className="w-full text-left">
      Logout
    </button>
  );
};
export default SignOutLink;
