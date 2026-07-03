import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/products(.*)",
  "/sign-in",
  "/sign-up",
  // Called by PayFast's servers, not a logged-in browser -- has no
  // session to check. Protected by its own signature/source verification
  // inside the route itself instead of Clerk's auth layer.
  "/api/payfast/notify",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authData = await auth();

  const isAdminUser = authData.userId === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (isAdminRoute(req) && !isAdminUser) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isPublicRoute(req) && !authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
