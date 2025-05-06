'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useRouter } from 'next/navigation'; // Import for potential redirect, though middleware handles most
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user?.email === 'admin@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, loading]);

  if (loading) {
    // More detailed skeleton matching the app layout with sidebar
    return (
      <div className="flex h-screen">
        <aside className="w-64 bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border">
           <div>
             <div className="flex items-center space-x-3 mb-10">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
             </div>
             <nav className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
             </nav>
           </div>
           <Skeleton className="h-10 w-full rounded-md" />
        </aside>
        <main className="flex-1 p-6 overflow-auto">
           {/* Main content loading skeleton */}
           <Skeleton className="h-16 w-full mb-6" /> {/* Header-like skeleton */}
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

  // If user is not logged in and not loading, middleware should have redirected.
  // This is a fallback or for cases where auth context resolves to null after loading.
  if (!user && !loading) {
    // This state ideally shouldn't be hit often due to middleware.
    // You might want a redirect here if middleware fails or for edge cases.
    // router.push('/signin'); // Could cause hydration issues if not handled carefully.
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to sign in...</p>
      </div>
    );
  }


  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* The MainHeader component will be part of children pages that require it */}
        <div className="p-6"> {/* Add padding around the content of each page */}
            {children}
        </div>
      </main>
    </div>
  );
}
