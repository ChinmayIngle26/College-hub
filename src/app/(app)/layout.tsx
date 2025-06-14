
'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCollapsedState = localStorage.getItem('sidebar-collapsed');
      if (storedCollapsedState) {
        setIsSidebarCollapsed(JSON.parse(storedCollapsedState));
      }
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user?.email === 'admin@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, loading]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };

  if (loading) {
    // More detailed skeleton matching the app layout with sidebar
    return (
      <div className="flex h-screen">
        <aside className={cn(
            "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}>
           <div>
             <div className="flex items-center space-x-3 mb-10">
                <Skeleton className="h-10 w-10 rounded-md" />
                {!isSidebarCollapsed && (
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                )}
             </div>
             <nav className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={cn("h-10 w-full rounded-md", isSidebarCollapsed && "w-10 mx-auto")} />
                ))}
             </nav>
           </div>
           <Skeleton className={cn("h-10 w-full rounded-md", isSidebarCollapsed && "w-10 mx-auto")} />
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

  if (!user && !loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to sign in...</p>
      </div>
    );
  }


  if (isAdmin) {
    // AdminLayout now manages its own collapse state
    return <AdminLayout>{children}</AdminLayout>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebarCollapse} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
            {children}
        </div>
      </main>
    </div>
  );
}
