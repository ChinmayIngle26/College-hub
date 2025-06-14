
'use client'; // Make this a client component to use useAuth

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceRecords } from '@/services/attendance'; // This service is now updated
import { useEffect, useState } from 'react'; 
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context'; 
import type { AttendanceRecord } from '@/services/attendance'; // This type might need adjustment if structure changed
import { format, parseISO } from 'date-fns';

function AttendanceTableLoader() {
    const { user, loading: authLoading } = useAuth(); 
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!authLoading && user) {
            const fetchRecords = async () => {
                setLoading(true);
                setError(null);
                try {
                    // The getAttendanceRecords service should now fetch from 'lectureAttendance'
                    const fetchedRecords = await getAttendanceRecords(user.uid); 
                    // The service already sorts by date desc, submittedAt desc
                    setRecords(fetchedRecords);
                } catch (err) {
                    console.error("Failed to fetch attendance records:", err);
                    setError("Could not load attendance data.");
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        } else if (!authLoading && !user) {
             setLoading(false);
             setError("Please sign in to view attendance.");
        }
    }, [user, authLoading]); 


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
                <TableHead>Lecture/Subject</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => ( // Added index for key, ensure record.date + lectureName is unique if possible
                <TableRow key={`${record.date}-${record.lectureName}-${index}`}>
                  <TableCell>{format(parseISO(record.date), 'PP')}</TableCell> {/* Format date for display */}
                  <TableCell>{record.lectureName || 'N/A'}</TableCell>
                  <TableCell>{record.classroomName || 'N/A'}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      record.status === 'present' ? 'text-green-600' : 'text-red-600' 
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
        <AttendanceTableLoader />
      </div>
    </>
  );
}
