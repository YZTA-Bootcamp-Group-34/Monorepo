import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Logged-in users should not see login/register
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything else is protected: no cookie -> login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static assets (any path with a file extension)
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
