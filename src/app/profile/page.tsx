import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudentProfile } from '@/services/profile';
import { Suspense } from 'react';

// Assume a default student ID for demonstration
const STUDENT_ID = '12345';

async function ProfileDetailsLoader() {
  const profile = await getStudentProfile(STUDENT_ID);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Student ID:</strong> {profile.studentId}</p>
        <p><strong>Major:</strong> {profile.major}</p>
        {/* Add more profile details here */}
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
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <ProfileDetailsLoader />
        </Suspense>
        {/* Add more sections like contact info, address, etc. */}
      </div>
    </>
  );
}
