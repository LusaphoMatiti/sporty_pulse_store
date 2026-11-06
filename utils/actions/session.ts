"use server";

import { getAuthUser as requireUser } from "@/utils/guards";

// Kept so the existing `import getAuthUser from "@/utils/action"` calls keep
// working. It lives in a "use server" module on purpose: the barrel is also
// imported by client components, and anything it re-exports from a plain
// module would be pulled into the browser bundle (database driver included).
// Server components can import { getAuthUser } from "@/utils/guards" instead.
export default async function getAuthUser() {
  return requireUser();
}
