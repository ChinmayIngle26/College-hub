'use client'; // Required for Recharts

import type { AttendanceRecord } from '@/services/attendance';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle, XCircle } from 'lucide-react';

interface AttendanceCardProps {
  attendanceRecords: AttendanceRecord[];
}

const COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-4))']; // Green for present, Red for absent

export function AttendanceCard({ attendanceRecords }: AttendanceCardProps) {
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((record) => record.status === 'present').length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const chartData = [
    { name: 'Present', value: presentDays },
    { name: 'Absent', value: absentDays },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1 xl:col-span-1">
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>
          Overall Attendance: <span className={`font-semibold ${attendancePercentage >= 80 ? 'text-green-600' : attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{attendancePercentage}%</span> ({presentDays}/{totalDays} days)
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {totalDays > 0 ? (
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="hsl(var(--primary))" // Default fill, overridden by Cell
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                   itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                 <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No attendance data available.</p>
        )}

        <div className="max-h-48 overflow-y-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {attendanceRecords.slice(0, 5).map((record, index) => ( // Show recent records
                <TableRow key={index}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    {record.status === 'present' ? (
                        <CheckCircle className="inline-block h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="inline-block h-5 w-5 text-red-500" />
                    )}
                    </TableCell>
                </TableRow>
                ))}
                 {attendanceRecords.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">No recent records</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>

      </CardContent>
    </Card>
  );
}
