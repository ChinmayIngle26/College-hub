import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getGrades } from '@/services/grades';
import { Suspense } from 'react';

// Assume a default student ID for demonstration
const STUDENT_ID = '12345';

async function GradesTableLoader() {
  const grades = await getGrades(STUDENT_ID);
    // Add logic to sort or filter grades if necessary
    // const sortedGrades = grades.sort(...);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Grades</CardTitle>
      </CardHeader>
      <CardContent>
        {grades.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.courseName}>
                  <TableCell>{grade.courseName}</TableCell>
                  <TableCell className="text-right font-medium">{grade.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">No grades available.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function GradesPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Grades
        </h2>
         <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <GradesTableLoader />
         </Suspense>
        {/* Optionally add GPA calculation, semester filters, etc. */}
      </div>
    </>
  );
}
