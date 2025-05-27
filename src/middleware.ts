
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSystemSettings } from '@/services/system-settings';
import type { SystemSettings } from '@/services/system-settings'; // Import SystemSettings type

const publicRoutes = ['/signin', '/signup'];
const maintenanceRoute = '/maintenance';
const adminRoutePrefix = '/admin';

// Default settings structure, ensure it matches SystemSettings interface
const defaultMiddlewareSettings: SystemSettings = {
  maintenanceMode: false,
  allowNewUserRegistration: true,
  applicationName: 'College Hub (Default)',
  defaultItemsPerPage: 10,
  announcementTitle: 'Welcome (Default)',
  announcementContent: 'Default announcement content.',
  lastUpdated: null,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  let settings: SystemSettings;

  try {
    settings = await getSystemSettings();
    // console.log(`Middleware: Fetched settings for ${pathname}. Maintenance Mode: ${settings.maintenanceMode}`);
  } catch (error) {
    console.error(`Middleware: CRITICAL Error fetching system settings for ${pathname}:`, error);
    // Fallback to default settings if fetching fails catastrophically
    settings = { ...defaultMiddlewareSettings };
    // console.log(`Middleware: Using fallback default settings due to error for ${pathname}. Maintenance Mode: ${settings.maintenanceMode}`);
  }

  const hasAuthCookie = request.cookies.has('firebaseAuthToken');
  // console.log(`Middleware Diagnostics for ${pathname}: AuthCookie: ${hasAuthCookie}, Maintenance Setting: ${settings.maintenanceMode}`);

  // --- Maintenance Mode Logic ---
  if (settings.maintenanceMode) {
    // console.log(`Middleware: Maintenance mode IS ON for ${pathname}.`);

    // Allow access to the maintenance page itself
    if (pathname === maintenanceRoute) {
      // console.log(`Middleware: Path ${pathname} is maintenanceRoute. Allowing.`);
      return NextResponse.next();
    }

    // Allow access to sign-in page (so admins can log in to turn off maintenance)
    if (pathname === '/signin') {
      // console.log(`Middleware: Path ${pathname} is /signin. Allowing.`);
      return NextResponse.next();
    }

    // Allow API routes (e.g., for Genkit, Firebase, etc.)
    if (pathname.startsWith('/api/')) {
      // console.log(`Middleware: Path ${pathname} is API route. Allowing.`);
      return NextResponse.next();
    }

    // Handle admin routes: admins need to access the admin panel to disable maintenance mode.
    if (pathname.startsWith(adminRoutePrefix)) {
      if (hasAuthCookie) {
        // User has an auth cookie; assume they might be an admin. Let them proceed.
        // Actual role check will happen on the admin pages.
        // console.log(`Middleware: Path ${pathname} is admin route with auth cookie. Allowing.`);
        return NextResponse.next();
      } else {
        // Trying to access admin route without auth. Redirect to sign-in so admin can log in.
        // console.log(`Middleware: Path ${pathname} is admin route, no auth cookie. Redirecting to /signin.`);
        url.pathname = '/signin';
        return NextResponse.redirect(url);
      }
    }

    // For all other routes not explicitly allowed above, redirect to maintenance page
    // console.log(`Middleware: Path ${pathname} not allowed during maintenance. Redirecting to ${maintenanceRoute}.`);
    url.pathname = maintenanceRoute;
    return NextResponse.redirect(url);
  }
  // console.log(`Middleware: Maintenance mode IS OFF for ${pathname}. Proceeding with normal auth logic.`);

  // --- Standard Auth Logic (if not in maintenance mode) ---
  const isProtectedRoute = !publicRoutes.includes(pathname) &&
                           pathname !== maintenanceRoute &&
                           !pathname.startsWith('/_next/') && // Next.js internals
                           !pathname.startsWith('/api/') &&    // API routes (already handled if maintenance was on)
                           pathname !== '/favicon.ico' &&
                           pathname !== '/placeholder-logo.svg'; // Static assets

  // 1. User is NOT authenticated and tries to access a PROTECTED route
  if (!hasAuthCookie && isProtectedRoute) {
    // console.log(`Middleware: No auth cookie, accessing protected route ${pathname}. Redirecting to /signin.`);
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // 2. User IS authenticated and tries to access a PUBLIC route (signin/signup)
  if (hasAuthCookie && publicRoutes.includes(pathname)) {
    // console.log(`Middleware: Auth cookie present, accessing public route ${pathname}. Redirecting to /.`)
    url.pathname = '/'; // Redirect to the root dashboard
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - placeholder-logo.svg (placeholder logo file)
     * It's important that this matcher DOES include /api routes, /signin, /maintenance, etc.,
     * as the middleware logic needs to run for them.
     */
    '/((?!_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
};
