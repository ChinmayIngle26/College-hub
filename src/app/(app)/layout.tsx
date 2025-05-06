'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && user?.email === 'admin@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user, loading]);

  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-4">
        {/* Main content area will include its own header (within child pages/layouts) */}
        {children}
      </main>
    </div>
  );
}

