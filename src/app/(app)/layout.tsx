
'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { FacultyLayout } from '@/components/layout/faculty-layout'; // New import
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore'; // For role checking
import { db } from '@/lib/firebase/client';     // For role checking

type UserRole = 'admin' | 'faculty' | 'student' | null;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [checkingRole, setCheckingRole] = useState(true); // New state for role check loading
  const router = useRouter();
  const [isStudentSidebarCollapsed, setIsStudentSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCollapsedState = localStorage.getItem('sidebar-collapsed');
      if (storedCollapsedState) {
        setIsStudentSidebarCollapsed(JSON.parse(storedCollapsedState));
      }
    }
  }, []);

  useEffect(() => {
    if (loading) { // Auth state is loading
      setCheckingRole(true);
      return;
    }

    if (!user) { // No user, not loading auth
      setUserRole(null);
      setCheckingRole(false);
      // Middleware should handle redirect to signin if on protected route
      return;
    }

    // User exists, check their role from Firestore
    setCheckingRole(true);
    if (user.email === 'admin@gmail.com') { // Hardcoded admin check first
      setUserRole('admin');
      setCheckingRole(false);
    } else if (db) { // Ensure db is initialized
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(userDocSnap => {
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === 'admin') {
            setUserRole('admin');
          } else if (userData.role === 'faculty') {
            setUserRole('faculty');
          } else {
            setUserRole('student'); // Default to student if role field is different or missing
          }
        } else {
          // console.warn(`User document not found for UID: ${user.uid}. Defaulting to student role.`);
          setUserRole('student'); // Default to student if no Firestore document
        }
      }).catch(error => {
        console.error("Error fetching user role:", error);
        setUserRole('student'); // Default to student on error
      }).finally(() => {
        setCheckingRole(false);
      });
    } else {
        // This case should ideally not be hit if db initializes correctly
        console.error("Firestore db instance is not available for role checking. Defaulting to student role.");
        setUserRole('student');
        setCheckingRole(false);
    }
  }, [user, loading]);

  const toggleStudentSidebarCollapse = () => {
    setIsStudentSidebarCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };

  if (loading || checkingRole) {
    // Unified loading skeleton
    return (
      <div className="flex h-screen">
        <aside className={cn(
            "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
            // Use a default collapse state for skeleton or a fixed one
            isStudentSidebarCollapsed ? "w-20" : "w-64" 
          )}>
           <div>
             <div className="flex items-center space-x-3 mb-10">
                <Skeleton className="h-10 w-10 rounded-md" />
                {!isStudentSidebarCollapsed && (
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                )}
             </div>
             <nav className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={cn("h-10 w-full rounded-md", isStudentSidebarCollapsed && "w-10 mx-auto")} />
                ))}
             </nav>
           </div>
           <Skeleton className={cn("h-10 w-full rounded-md", isStudentSidebarCollapsed && "w-10 mx-auto")} />
        </aside>
        <main className="flex-1 p-6 overflow-auto">
           <Skeleton className="h-16 w-full mb-6" />
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
           </div>
           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-[590px] w-full" />
                </div>
            </div>
        </main>
      </div>
    );
  }

  if (!user && !loading && !checkingRole) { // User definitely not logged in
    // Middleware should have redirected. If we reach here, it's an unexpected state or public page (which this layout isn't for).
    // For robustness, can show a redirecting message or minimal UI.
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  // Render layout based on role
  if (userRole === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (userRole === 'faculty') {
    return <FacultyLayout>{children}</FacultyLayout>;
  }

  // Default to student layout
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isStudentSidebarCollapsed} toggleCollapse={toggleStudentSidebarCollapse} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
            {children}
        </div>
      </main>
    </div>
  );
}
