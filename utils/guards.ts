// Authentication and admin guards used by every server action. This file has
// no "use server" directive on purpose: these helpers are called by other
// server code and must not be reachable as public endpoints.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppError } from "@/utils/app-error";

export const getAuthUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "You must be logged in");
  }
  // Shape: { id, email, name, image } -- different from Clerk's user
  // object, notably no .emailAddresses array, just a plain .email string.
  return session.user;
};

export const getAdminUser = async () => {
  const user = await getAuthUser();
  // Now compares email rather than a hardcoded ID -- matches the same
  // change made in middleware.ts, and survives database reseeds.
  const adminEmail = process.env.ADMIN_EMAIL;
  // Fail closed: if ADMIN_EMAIL is not set, nobody is an admin. The comparison
  // is deliberately exact (case-sensitive).
  if (!adminEmail || user.email !== adminEmail) redirect("/");
  return user;
};
