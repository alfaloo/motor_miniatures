import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // If unauthenticated, redirect to /login with callbackUrl
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Forward resolved theme cookie as a request header so the root layout
  // can apply the correct data-theme attribute server-side (no FOUC).
  const resolvedTheme = req.cookies.get("theme-resolved")?.value;
  if (resolvedTheme === "light" || resolvedTheme === "dark") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-theme-resolved", resolvedTheme);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - /login and /register (public auth routes)
     * - api/auth (NextAuth internal routes)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|login|register|api/auth).*)",
  ],
};
