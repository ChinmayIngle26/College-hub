// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/client'; // Assuming firebase client setup exports auth
import { onAuthStateChanged } from 'firebase/auth'; // We CANNOT use hooks/client-side functions here

// Define public routes that don't require authentication
const publicRoutes = ['/signin', '/signup'];
// Define routes that are part of the main application and require authentication
// Using a prefix check is generally more robust than listing every single route
const protectedRoutePrefix = '/'; // Matches the root and anything under (app) group implicitly

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // --- Check for Firebase Auth Token Cookie ---
  // This is a common pattern, but Firebase JS SDK manages token state internally by default.
  // Relying solely on a custom cookie might lead to inconsistencies if the token
  // expires or is refreshed. For server-side checks, consider Firebase Admin SDK
  // or passing the ID token from the client if needed, but that adds complexity.
  // For this middleware (client-side navigation focused), we'll primarily rely on redirect logic.
  // A simple cookie check can provide a basic layer but isn't foolproof.
  const hasAuthCookie = request.cookies.has('firebaseIdToken'); // Replace 'firebaseIdToken' if you use a different cookie name

  // --- Determine if the current route is protected ---
  // Exclude explicit public routes and Next.js internal paths
  const isProtectedRoute = !publicRoutes.includes(pathname) &&
                          !pathname.startsWith('/_next/') &&
                          !pathname.startsWith('/api/') &&
                           pathname !== '/favicon.ico' &&
                           pathname !== '/placeholder-logo.svg';

   // --- Logic ---

   // 1. User is NOT authenticated (no cookie as basic check) and tries to access a PROTECTED route
   if (!hasAuthCookie && isProtectedRoute) {
     // Redirect to sign-in page, preserving the intended destination
     url.pathname = '/signin';
     // Optional: Add the original path as a query parameter for redirecting back after login
     // url.searchParams.set('redirect', pathname);
     console.log(`Middleware: No auth cookie, accessing protected route ${pathname}. Redirecting to /signin.`);
     return NextResponse.redirect(url);
   }

   // 2. User IS authenticated (has cookie as basic check) and tries to access a PUBLIC route (signin/signup)
   if (hasAuthCookie && publicRoutes.includes(pathname)) {
     // Redirect to the main dashboard/home page
     url.pathname = '/'; // Redirect to the root which is handled by (app) group
     console.log(`Middleware: Auth cookie present, accessing public route ${pathname}. Redirecting to /.`)
     return NextResponse.redirect(url);
   }

  // 3. Allow all other requests (user is authenticated on protected route, or anyone on a public route)
   console.log(`Middleware: Allowing request to ${pathname}. AuthCookie: ${hasAuthCookie}, IsProtectedRoute: ${isProtectedRoute}`);
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
     * - Specific public files if any (e.g., /robots.txt)
     *
     * This ensures the middleware runs for all page navigations.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
};
