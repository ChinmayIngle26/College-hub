// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('firebaseIdToken'); // Check for a token cookie (adjust name if needed)

  // Check if the user is trying to access a protected route without a token
  if (!authToken && !publicRoutes.includes(pathname)) {
    // Redirect to sign-in page
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

    // Check if the user is trying to access a public route while already logged in
  if (authToken && publicRoutes.includes(pathname)) {
    // Redirect to the dashboard (or home page)
    const url = request.nextUrl.clone();
    url.pathname = '/'; // Or your main dashboard route
    return NextResponse.redirect(url);
  }


  // Allow the request to proceed if it's a public route or if the user is authenticated
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - placeholder-logo.svg (placeholder logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
};
