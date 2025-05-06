'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';

// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

export default function AdminSettingsPage() {
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

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userDataFromDb = userDocSnap.data();
              if (userDataFromDb.role === 'admin') {
                userIsCurrentlyAdmin = true;
              }
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            // Handle error (e.g., show a toast)
          }
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminAccess();

  }, [user, authLoading, router]);

  if (authLoading || checkingRole) {
    return (
      
        Loading...
      
    );
  }

  if (!isAdmin) {
    return (
      
        
          
            Access Denied
          
          You do not have permission to view this page.
          
            Go to Dashboard
          
        
      
    );
  }

  return (
    
      
        
          
            Admin Settings
          
          
            Here you can configure system-wide settings. This is a placeholder.
          
        
      
    
  );
}
