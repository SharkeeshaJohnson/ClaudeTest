import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (exact match for "/" to avoid matching everything)
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  // Check for Privy auth token in cookies
  // Privy v3.x uses "privy-id-token" as the cookie name
  const privyToken = request.cookies.get("privy-id-token");

  // If no token, redirect to login
  if (!privyToken) {
    console.log(`[Middleware] No privy token, redirecting ${pathname} to /login`);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
