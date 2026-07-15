"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getServerUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id };
}

export async function getServerUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
