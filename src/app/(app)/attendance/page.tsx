
'use client'; // Make this a client component to use useAuth

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceRecords } from '@/services/attendance';
import { Suspense, useEffect, useState } from 'react'; // Add useEffect, useState
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import type { AttendanceRecord } from '@/services/attendance';

// No longer need a default STUDENT_ID, will use logged-in user's ID


function AttendanceTableLoader() {
    const { user, loading: authLoading } = useAuth(); // Get user and loading state
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!authLoading && user) {
            const fetchRecords = async () => {
                setLoading(true);
                setError(null);
                try {
                    const fetchedRecords = await getAttendanceRecords(user.uid); // Use user.uid
                    const sortedRecords = fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setRecords(sortedRecords);
                } catch (err) {
                    console.error("Failed to fetch attendance records:", err);
                    setError("Could not load attendance data.");
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        } else if (!authLoading && !user) {
             // Handle case where user is not logged in
             setLoading(false);
             // Optionally set an error or specific state
             setError("Please sign in to view attendance.");
        }
    }, [user, authLoading]); // Re-run if user or authLoading changes


    if (loading || authLoading) {
      return <Skeleton className="h-96 w-full" />;
    }

    if (error) {
        return <p className="text-center text-destructive">{error}</p>;
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.date}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      record.status === 'present' ? 'text-green-600' : 'text-red-600' // Keep explicit colors or switch to theme-based?
                    )}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
           <p className="text-center text-muted-foreground">No attendance records found.</p>
        )}
      </CardContent>
    </Card>
  );
}


export default function AttendancePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Attendance
        </h2>
        {/* Suspense boundary remains useful if AttendanceTableLoader itself had internal async ops */}
        {/* but primary loading is now handled inside */}
        <AttendanceTableLoader />
         {/* Optionally add filters for date range, courses etc. */}
      </div>
    </>
  );
}
