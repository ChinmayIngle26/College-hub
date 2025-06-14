
'use client';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data
const mockClassrooms = [
    { id: 'classroom1', name: 'CS101 - Section A' },
    { id: 'classroom2', name: 'MA205 - Morning Batch' },
];
const mockStudents = {
    classroom1: [
        { id: 'student1', name: 'Alice Smith', studentId: 'S1001' },
        { id: 'student2', name: 'Bob Johnson', studentId: 'S1002' },
    ],
    classroom2: [
        { id: 'student3', name: 'Charlie Brown', studentId: 'S2001' },
    ],
};

type StudentAttendanceStatus = {
    [studentId: string]: 'present' | 'absent' | undefined;
};


export default function FacultyAttendancePage() {
    const [selectedClassroom, setSelectedClassroom] = useState<string | undefined>();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [lectureName, setLectureName] = useState<string>('');
    const [attendanceStatus, setAttendanceStatus] = useState<StudentAttendanceStatus>({});

    const currentStudents = selectedClassroom ? (mockStudents as any)[selectedClassroom] || [] : [];

    const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmitAttendance = () => {
        // Logic to submit attendance data
        console.log({
            classroomId: selectedClassroom,
            date: selectedDate,
            lectureName,
            statuses: attendanceStatus,
        });
        // Show toast or confirmation
    };


  return (
    <>
        <MainHeader />
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Update Attendance
            </h2>

            <Card>
                <CardHeader>
                    <CardTitle>Record Lecture Attendance</CardTitle>
                    <CardDescription>Select a classroom, date, and lecture to mark attendance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="classroom">Select Classroom</Label>
                            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                                <SelectTrigger id="classroom">
                                    <SelectValue placeholder="Choose a classroom" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockClassrooms.map(cr => (
                                        <SelectItem key={cr.id} value={cr.id}>{cr.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="date">Select Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="lectureName">Lecture Name/Topic</Label>
                            <Input 
                                id="lectureName" 
                                placeholder="e.g., Chapter 5 Review" 
                                value={lectureName}
                                onChange={(e) => setLectureName(e.target.value)}
                            />
                        </div>
                    </div>

                    {selectedClassroom && selectedDate && lectureName && currentStudents.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Mark Attendance for: {mockClassrooms.find(c=>c.id === selectedClassroom)?.name} on {format(selectedDate, "PPP")} ({lectureName})</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentStudents.map((student: any) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.studentId}</TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup 
                                                    defaultValue={attendanceStatus[student.id]} 
                                                    onValueChange={(value) => handleStatusChange(student.id, value as 'present' | 'absent')}
                                                    className="flex justify-center gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="present" id={`${student.id}-present`} />
                                                        <Label htmlFor={`${student.id}-present`} className="text-green-600 flex items-center"><CheckCircle className="mr-1 h-4 w-4"/>Present</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="absent" id={`${student.id}-absent`} className="border-red-500 text-red-500 focus-visible:ring-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
                                                        <Label htmlFor={`${student.id}-absent`} className="text-red-600 flex items-center"><XCircle className="mr-1 h-4 w-4"/>Absent</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSubmitAttendance} disabled={Object.keys(attendanceStatus).length !== currentStudents.length}>
                                    Submit Attendance
                                </Button>
                            </div>
                        </div>
                    )}
                     {selectedClassroom && selectedDate && lectureName && currentStudents.length === 0 && (
                        <p className="text-muted-foreground text-center mt-4">No students found in the selected classroom, or classroom data is loading.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
