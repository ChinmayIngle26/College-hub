import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceRecords } from '@/services/attendance';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

// Assume a default student ID for demonstration
const STUDENT_ID = '12345';

async function AttendanceTableLoader() {
  const records = await getAttendanceRecords(STUDENT_ID);
  const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedRecords.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.date}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
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
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
           <AttendanceTableLoader />
        </Suspense>
         {/* Optionally add filters for date range, courses etc. */}
      </div>
    </>
  );
}
