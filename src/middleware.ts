
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSystemSettings } from '@/services/system-settings';

const publicRoutes = ['/signin', '/signup'];
const maintenanceRoute = '/maintenance';
const adminRoutePrefix = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // --- Fetch System Settings ---
  // Note: Calling services (especially async ones) in middleware can impact performance.
  // Consider caching strategies for settings if they don't change frequently.
  // getSystemSettings has internal fallbacks to default if Firestore fails.
  let settings;
  try {
    settings = await getSystemSettings();
  } catch (error) {
    console.error("Middleware: Error fetching system settings:", error);
    // Fallback to default settings (maintenanceMode typically false by default)
    // If getSystemSettings throws, it means a critical failure.
    // For safety, we might assume maintenance mode is OFF if settings are totally un-fetchable
    // or handle this as a server error. Let's assume getSystemSettings returns defaults.
    settings = { 
        maintenanceMode: false, 
        allowNewUserRegistration: true, 
        applicationName: 'College Hub', 
        defaultItemsPerPage: 10,
        announcementTitle: 'Welcome',
        announcementContent: 'Welcome to the platform'
    }; 
  }

  const hasAuthCookie = request.cookies.has('firebaseAuthToken');

  // --- Maintenance Mode Logic ---
  if (settings.maintenanceMode) {
    // Allow access to the maintenance page itself
    if (pathname === maintenanceRoute) {
      return NextResponse.next();
    }
    // Allow access to sign-in page (so admins can log in)
    if (pathname === '/signin') {
      return NextResponse.next();
    }
    // Allow access to admin routes if the user is authenticated (basic check)
    // Actual admin role check will happen on the admin pages themselves.
    if (pathname.startsWith(adminRoutePrefix) && hasAuthCookie) {
      return NextResponse.next();
    }
    // Allow API routes (e.g. for Genkit or other backend functions)
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // For all other routes, redirect to maintenance page
    url.pathname = maintenanceRoute;
    console.log(`Middleware: Maintenance mode ON. Redirecting ${pathname} to ${maintenanceRoute}.`);
    return NextResponse.redirect(url);
  }

  // --- Standard Auth Logic (if not in maintenance mode) ---
  const isProtectedRoute = !publicRoutes.includes(pathname) &&
                           pathname !== maintenanceRoute && // Maintenance page is not "protected" in the auth sense
                           !pathname.startsWith('/_next/') &&
                           !pathname.startsWith('/api/') &&
                           pathname !== '/favicon.ico' &&
                           pathname !== '/placeholder-logo.svg';

  // 1. User is NOT authenticated and tries to access a PROTECTED route
  if (!hasAuthCookie && isProtectedRoute) {
    url.pathname = '/signin';
    console.log(`Middleware: No auth cookie, accessing protected route ${pathname}. Redirecting to /signin.`);
    return NextResponse.redirect(url);
  }

  // 2. User IS authenticated and tries to access a PUBLIC route (signin/signup)
  if (hasAuthCookie && publicRoutes.includes(pathname)) {
    url.pathname = '/'; // Redirect to the root dashboard
    console.log(`Middleware: Auth cookie present, accessing public route ${pathname}. Redirecting to /.`)
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
     * Does NOT exclude /api routes explicitly here, handled in logic if needed.
     */
    '/((?!_next/static|_next/image|favicon.ico|placeholder-logo.svg).*)',
  ],
};
