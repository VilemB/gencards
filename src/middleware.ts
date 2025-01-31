import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/auth/signin", "/auth/signup", "/community"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // Protected paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/decks",
    "/profile",
    "/api/decks",
    "/api/cards",
    "/api/user",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

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
