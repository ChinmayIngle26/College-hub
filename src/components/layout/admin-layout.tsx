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
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { auth } from '@/lib/firebase/client'; // Import auth
import { signOut } from 'firebase/auth'; // Import signOut
import { useToast } from '@/hooks/use-toast'; // Import useToast

const adminNavigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/admin', label: 'User Management', icon: Users },
  { href: '/admin/settings', label: 'System Settings', icon: Settings }, // Example admin settings page
  // Add other admin-specific links here
];

// Helper function to delete a cookie
function deleteCookie(name: string) {
  if (typeof document !== 'undefined') { // Ensure document is available (client-side)
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}


export function AdminLayout({ children }: { children: React.ReactNode }) {
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
        
            {/* Optional: Add sidebar skeleton */}
        
    );
}


  return (
    
      
        {/* Placeholder Logo */}
        
          
            
          
          
            AISSMS
            Admin Panel
          
        
      

      
        {adminNavigationItems.map((item) => (
          
            
              
                
                {item.label}
              
            
          
        ))}
      

      
        {user ? (
          // Show Logout if user is logged in
          
            
              
              Logout
            
          
        ) : (
          // Should ideally not happen since middleware redirects unauth users, but good to have
          
             
              
                
                Sign In
              
            
          
        )}
      
      
        {children}
      
    
  );
}
