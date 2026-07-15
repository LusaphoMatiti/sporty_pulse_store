import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Exact-path public routes
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/sign-in",
  "/sign-up",
  "/api/payfast/notify",
];

// Prefix-matched public routes (this path or anything nested under it)
const PUBLIC_ROUTE_PREFIXES = [
  "/products",
  // NextAuth's own routes (signin, callback, session, csrf, signout).
  // Without this, the sign-in flow blocks itself -- the callback URL
  // would get redirected to /sign-in before NextAuth ever handles it.
  "/api/auth",
];

const isPublicRoute = (pathname: string) => {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const isAdminRoute = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Admin check now compares email rather than a hardcoded user ID --
  // no longer breaks every time the database gets reseeded.
  const isAdminUser = token?.email === process.env.ADMIN_EMAIL;

  if (isAdminRoute(pathname) && !isAdminUser) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isPublicRoute(pathname) && !token) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
