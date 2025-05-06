'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import {
  Home,
  User,
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  Vote,
  LogOut,
  School, // Using School icon as placeholder for college logo
  UserCog, // Icon for Admin
  LogIn, // Icon for Sign In
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { auth } from '@/lib/firebase/client'; // Import auth
import { signOut } from 'firebase/auth'; // Import signOut
import { useToast } from '@/hooks/use-toast'; // Import useToast

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { href: '/voting', label: 'Voting System', icon: Vote },
  { href: '/admin', label: 'Admin Panel', icon: UserCog }, // Added Admin link
];

// Helper function to delete a cookie
function deleteCookie(name: string) {
  if (typeof document !== 'undefined') { // Ensure document is available (client-side)
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}


export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth(); // Get user and loading state
  const router = useRouter(); // Get router instance
  const { toast } = useToast(); // Get toast function

  const handleLogout = async () => {
    try {
      await signOut(auth);

      // --- Clear the auth cookie ---
      deleteCookie('firebaseAuthToken');

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/signin'); // Redirect to sign-in page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Don't render sidebar content until auth state is loaded
  // This prevents brief flashes of incorrect state
  if (loading) {
    return (
        <aside className="hidden w-64 flex-col border-r bg-sidebar p-4 shadow-md md:flex">
            {/* Optional: Add sidebar skeleton */}
        </aside>
    );
}


  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar p-4 shadow-md md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        {/* Placeholder Logo */}
        <div className="rounded-md bg-red-100 p-2">
          <School className="h-7 w-7 text-red-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sidebar-foreground">AISSMS</h2>
          <p className="text-xs text-muted-foreground">College of Engineering</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => (
          <Link href={item.href} key={item.label} legacyBehavior passHref>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                // Match base path segment for active state
                (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        {user ? (
          // Show Logout if user is logged in
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout} // Add onClick handler for logout action
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        ) : (
          // Show Sign In if user is not logged in
          <Link href="/signin" legacyBehavior passHref>
             <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                 pathname === '/signin' && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}
