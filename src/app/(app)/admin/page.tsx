
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define a specific admin email (or use Firestore roles for a more robust solution)
// For this example, we'll primarily rely on a 'role' field in Firestore.
// const ADMIN_EMAIL = "admin@example.com"; // Example admin email

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to complete
    }

    if (!user) {
      router.push('/signin'); // Redirect if not authenticated
      return;
    }

    // Check user role from Firestore
    const checkAdminRole = async () => {
      setCheckingRole(true);
      if (db && user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'admin') {
              setIsAdmin(true);
            } else {
              // If user is not admin, redirect to home or show access denied
              // For now, redirecting to home
              router.push('/');
            }
          } else {
            // User document doesn't exist, treat as non-admin
            router.push('/');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Handle error, perhaps redirect or show error message
          router.push('/');
        }
      } else {
        // db or user is null, should not happen if auth checks passed
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminRole();

  }, [user, authLoading, router]);

  if (authLoading || checkingRole) {
    return (
      <>
        <MainHeader />
        <div className="space-y-6 p-6 md:p-8 lg:p-10">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    // This state should ideally be handled by the redirect,
    // but as a fallback or if redirect hasn't completed:
    return (
      <>
        <MainHeader />
        <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center">
            <ShieldAlert className="h-16 w-16 text-destructive" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
        </div>
      </>
    );
  }

  // Render Admin Panel if user is admin
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
         <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admin Panel
          </h2>
           {/* Optional: Add a button for a common admin action */}
           {/* <Button>
             <UserPlus className="mr-2 h-4 w-4" /> Add New User
           </Button> */}
         </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Example Card: User Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary"/>
                        User Management
                    </CardTitle>
                    <CardDescription>View, add, edit, or remove users.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Add links or buttons for specific actions */}
                    <Button variant="outline" className="w-full">Manage Users</Button>
                </CardContent>
            </Card>

            {/* Example Card: System Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary"/>
                        System Settings
                    </CardTitle>
                    <CardDescription>Configure application settings.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button variant="outline" className="w-full">Configure Settings</Button>
                </CardContent>
            </Card>

            {/* Add more admin feature cards as needed */}
             <Card>
                <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>Manage announcements, calendar, etc.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full">Manage Content</Button>
                </CardContent>
            </Card>

        </div>
      </div>
    </>
  );
}
