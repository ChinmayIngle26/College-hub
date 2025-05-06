
'use client'; // Make this a client component

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// Removed getStudentProfile import as we fetch differently now
import { Suspense, useEffect, useState } from 'react'; // Add useEffect, useState
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '@/lib/firebase/client'; // Import db instance
import type { StudentProfile } from '@/services/profile'; // Import type


// No longer need default STUDENT_ID

function ProfileDetailsLoader() {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        if (!db) {
          setError("Database connection is not available.");
          setLoading(false);
          return;
        }
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfile({
              name: userData.name || 'N/A',
              studentId: userData.studentId || user.uid, // Use Firestore studentId or fallback to uid
              major: userData.major || 'N/A',
            });
          } else {
            console.warn(`User document not found for UID: ${user.uid}`);
            setError("Profile data not found.");
             // Set a fallback profile using email?
            setProfile({ name: user.email || 'User', studentId: user.uid, major: 'Unknown' });
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
          setError("Could not load profile data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading && !user) {
       setLoading(false);
       setError("Please sign in to view your profile.");
    }
  }, [user, authLoading]);


  if (loading || authLoading) {
     return <Skeleton className="h-48 w-full" />;
  }

  if (error) {
     return <p className="text-center text-destructive">{error}</p>;
  }

   if (!profile) {
     // This case should ideally be covered by error or loading states
     return <p className="text-center text-muted-foreground">Profile not available.</p>;
   }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Student ID:</strong> {profile.studentId}</p>
        <p><strong>Major:</strong> {profile.major}</p>
        {/* Add more profile details here if available in Firestore */}
         {user && <p><strong>Email:</strong> {user.email}</p>}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          My Profile
        </h2>
        {/* Suspense is less critical now but can stay */}
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <ProfileDetailsLoader />
        </Suspense>
        {/* Add more sections like contact info, address, etc. */}
      </div>
    </>
  );
}
