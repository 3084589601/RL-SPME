import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminPath, isMemberPath } from "@/lib/permissions";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const needsAuth =
    path === "/login" || isAdminPath(path) || isMemberPath(path);
  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  const role = token?.role as string | undefined;

  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminPath(path) && role !== "ADMIN") {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (isMemberPath(path) && role !== "ADMIN" && role !== "MEMBER") {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/profile/:path*",
    "/resources/:path*",
    "/learning/:path*",
  ],
};
