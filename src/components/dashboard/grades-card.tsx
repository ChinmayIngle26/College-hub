import type { Grade } from '@/services/grades';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookMarked } from 'lucide-react';

interface GradesCardProps {
  grades: Grade[];
}

// Helper to assign colors based on grade (adjust logic as needed)
const getGradeColor = (grade: string): string => {
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A')) return 'text-green-600';
  if (upperGrade.startsWith('B')) return 'text-blue-600';
  if (upperGrade.startsWith('C')) return 'text-yellow-600';
  if (upperGrade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600'; // F or other
};


export function GradesCard({ grades }: GradesCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          Grades Overview
        </CardTitle>
         <CardDescription>Your performance across courses.</CardDescription>
      </CardHeader>
      <CardContent>
        {grades.length > 0 ? (
           <div className="max-h-60 overflow-y-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {grades.map((grade, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{grade.courseName}</TableCell>
                        <TableCell className={`text-right font-semibold ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
           </div>
        ) : (
            <p className="text-center text-muted-foreground">No grade data available yet.</p>
        )}

      </CardContent>
    </Card>
  );
}
