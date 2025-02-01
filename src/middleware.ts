import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip auth check for authentication-related paths
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/auth/error")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Protected paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/decks",
    "/profile",
    "/settings",
    "/api/decks",
    "/api/cards",
    "/api/user",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Additional API route protection
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const referer = request.headers.get("referer");
    const isFromSameDomain = referer?.includes(
      request.headers.get("host") || ""
    );

    if (!isFromSameDomain) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  // If authenticated user tries to access landing page, redirect to dashboard
  if (isAuthenticated && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is authenticated and tries to access auth pages, redirect to dashboard
  if (isAuthenticated && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is not authenticated and tries to access protected paths, redirect to signin
  if (!isAuthenticated && isProtectedPath) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
