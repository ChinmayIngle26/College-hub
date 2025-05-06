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
//   // UserCog, // Icon for Admin - Removed
//   LogIn, // Icon for Sign In
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { useAuth } from '@/context/auth-context'; // Import useAuth
// import { auth } from '@/lib/firebase/client'; // Import auth
// import { signOut } from 'firebase/auth'; // Import signOut
// import { useToast } from '@/hooks/use-toast'; // Import useToast

// const navigationItems = [
//   { href: '/', label: 'Home', icon: Home },
//   { href: '/profile', label: 'My Profile', icon: User },
//   { href: '/attendance', label: 'Attendance', icon: CheckSquare },
//   { href: '/grades', label: 'Grades', icon: GraduationCap },
//   { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
//   { href: '/voting', label: 'Voting System', icon: Vote },
//   // { href: '/admin', label: 'Admin Panel', icon: UserCog }, // Removed Admin link
// ];

// // Helper function to delete a cookie
// function deleteCookie(name: string) {
//   if (typeof document !== 'undefined') { // Ensure document is available (client-side)
//       document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
//   }
// }


// export function Sidebar() {
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
//             College of Engineering
          
        
      

      
//         {navigationItems.map((item) => (
          
            
              
                
//                 {item.label}
              
            
          
//         ))}
      

      
//         {user ? (
//           // Show Logout if user is logged in
          
            
              
//               Logout
            
          
//         ) : (
//           // Show Sign In if user is not logged in
          
             
              
                
//                 Sign In
              
            
          
//         )}
      
    
//   );
// }


'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  User,
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  Vote,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { href: '/voting', label: 'Voting System', icon: Vote },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export function Sidebar() {
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
    return <div className="p-4 text-gray-500">Loading sidebar...</div>;
  }

  return (
    <aside className="w-64 bg-gray-900 text-white h-full p-6">
      <h1 className="text-xl font-bold mb-8">AISSMS College of Engineering</h1>
      <nav className="space-y-4">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-gray-700 ${
              pathname === item.href ? 'bg-gray-700' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        {user ? (
          <Button onClick={handleLogout} className="w-full flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        ) : (
          <Button onClick={() => router.push('/signin')} className="w-full flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}
