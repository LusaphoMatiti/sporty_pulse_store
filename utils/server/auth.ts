"use server";

import { auth } from "@clerk/nextjs/server";

export async function getServerUser() {
  const { userId } = await auth();

  if (!userId) return null;

  return { id: userId };
}

export async function getServerUserId() {
  const { userId } = await auth();
  return userId ?? null;
}
