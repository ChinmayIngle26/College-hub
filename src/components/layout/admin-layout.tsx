// 'use client';

// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
// import {
//   Home,
//   User,
//   CheckSquare,
//   GraduationCap,
//   CalendarCheck,
//   Vote,
//   LogOut,
//   School, // Using School icon as placeholder for college logo
//   Users,
//   Settings
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { useAuth } from '@/context/auth-context'; // Import useAuth
// import { auth } from '@/lib/firebase/client'; // Import auth
// import { signOut } from 'firebase/auth'; // Import signOut
// import { useToast } from '@/hooks/use-toast'; // Import useToast

// const adminNavigationItems = [
//   { href: '/', label: 'Home', icon: Home },
//   { href: '/admin', label: 'User Management', icon: Users },
//   { href: '/admin/settings', label: 'System Settings', icon: Settings }, // Example admin settings page
//   // Add other admin-specific links here
// ];

// // Helper function to delete a cookie
// function deleteCookie(name: string) {
//   if (typeof document !== 'undefined') { // Ensure document is available (client-side)
//       document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
//   }
// }


// export function AdminLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const { user, loading } = useAuth(); // Get user and loading state
//   const router = useRouter(); // Get router instance
//   const { toast } = useToast(); // Get toast function

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);

//       // --- Clear the auth cookie ---
//       deleteCookie('firebaseAuthToken');

//       toast({
//         title: 'Logged Out',
//         description: 'You have been successfully logged out.',
//       });
//       router.push('/signin'); // Redirect to sign-in page after logout
//     } catch (error) {
//       console.error('Logout failed:', error);
//       toast({
//         title: 'Logout Failed',
//         description: 'Could not log you out. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };

//   // Don't render sidebar content until auth state is loaded
//   // This prevents brief flashes of incorrect state
//   if (loading) {
//     return (
        
//             {/* Optional: Add sidebar skeleton */}
        
//     );
// }


//   return (
    
      
//         {/* Placeholder Logo */}
        
          
            
          
          
//             AISSMS
//             Admin Panel
          
        
      

      
//         {adminNavigationItems.map((item) => (
          
            
              
                
//                 {item.label}
              
            
          
//         ))}
      

      
//         {user ? (
//           // Show Logout if user is logged in
          
            
              
//               Logout
            
          
//         ) : (
//           // Should ideally not happen since middleware redirects unauth users, but good to have
          
             
              
                
//                 Sign In
              
            
          
//         )}
      
      
//         {children}
      
    
//   );
// }


'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Settings,
  LogOut,
  School
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const adminNavigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/admin', label: 'User Management', icon: Users },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (auth) { // Ensure auth is not null
      try {
        await signOut(auth);
        deleteCookie('firebaseAuthToken');
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
        });
        router.push('/signin');
      } catch (error) {
        console.error('Logout failed:', error);
        toast({
          title: 'Logout Failed',
          description: 'Could not log you out. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      console.error('Firebase auth is not initialized');
      toast({
        title: 'Logout Failed',
        description: 'Authentication system is not properly initialized.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading admin panel...</div>;
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <div className="flex items-center space-x-2 text-xl font-bold">
          <School className="w-6 h-6" />
          <span>AISSMS Admin</span>
        </div>

        <nav className="flex flex-col space-y-2 mt-6">
          {adminNavigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800 transition',
                pathname === item.href && 'bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-start space-x-2 text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
