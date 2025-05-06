// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Firebase client-side SDK (like `auth` from client.ts) CANNOT be reliably used in middleware
// because middleware runs in an edge environment separate from the browser.
// We need a way to check authentication state that works server-side/edge.
// A common approach is checking for a specific cookie set upon login.

// Define public routes that don't require authentication
const publicRoutes = ['/signin', '/signup'];
// Define routes that are part of the main application and require authentication
// Routes within the (app) group are protected by default if not public.
const protectedRoutePrefix = '/'; // Matches the root and anything under (app) group implicitly

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // --- Check for Firebase Auth Token Cookie ---
  // This is a common pattern. You'd set this cookie on the client-side after successful login.
  // NOTE: Firebase JS SDK manages token state internally by default.
  // For robust middleware checks, you might need Firebase Admin SDK on a backend or
  // use specific patterns like passing ID tokens, but that's more complex.
  // This cookie check provides a basic but common layer for middleware.
  // Ensure you are setting a cookie named 'firebaseAuthToken' (or similar) upon successful login/signup
  // and clearing it on logout on the client-side.
  const hasAuthCookie = request.cookies.has('firebaseAuthToken'); // Using a placeholder name


  // --- Determine if the current route is protected ---
  // Exclude explicit public routes and Next.js internal/static paths
  const isProtectedRoute = !publicRoutes.includes(pathname) &&
                          !pathname.startsWith('/_next/') &&
                          !pathname.startsWith('/api/') &&
                           pathname !== '/favicon.ico' &&
                           pathname !== '/placeholder-logo.svg'; // Exclude placeholder logo

   // --- Logic ---

   // 1. User is NOT authenticated (no cookie as basic check) and tries to access a PROTECTED route
   if (!hasAuthCookie && isProtectedRoute) {
     // Redirect to sign-in page
     url.pathname = '/signin';
     console.log(`Middleware: No auth cookie, accessing protected route ${pathname}. Redirecting to /signin.`);
     return NextResponse.redirect(url);
   }

   // 2. User IS authenticated (has cookie as basic check) and tries to access a PUBLIC route (signin/signup)
   if (hasAuthCookie && publicRoutes.includes(pathname)) {
     // Redirect to the main dashboard/home page
     url.pathname = '/'; // Redirect to the root which is handled by (app) layout
     console.log(`Middleware: Auth cookie present, accessing public route ${pathname}. Redirecting to /.`)
     return NextResponse.redirect(url);
   }

  // 3. Allow all other requests
  // (e.g., authenticated user on protected route, unauthenticated user on public route)
  // console.log(`Middleware: Allowing request to ${pathname}. AuthCookie: ${hasAuthCookie}, IsProtectedRoute: ${isProtectedRoute}`);
  return NextResponse.next();
}

// --- Matcher Configuration ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - placeholder-logo.svg (placeholder logo file)
     *
     * This ensures the middleware runs for all page navigations.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
};
