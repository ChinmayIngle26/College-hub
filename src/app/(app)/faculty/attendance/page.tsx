
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
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockClassrooms = [
    { id: 'classroom1', name: 'CS101 - Section A', subject: 'Introduction to Programming' },
    { id: 'classroom2', name: 'MA205 - Morning Batch', subject: 'Calculus II' },
    { id: 'classroom3', name: 'PHY201 - Lab Group 1', subject: 'Physics Lab I'},
];

interface Student {
    id: string;
    name: string;
    studentId: string;
}

const mockStudents: { [classroomId: string]: Student[] } = {
    classroom1: [
        { id: 'student1', name: 'Alice Smith', studentId: 'S1001' },
        { id: 'student2', name: 'Bob Johnson', studentId: 'S1002' },
        { id: 'student3', name: 'Carol Williams', studentId: 'S1003' },
        { id: 'student4', name: 'David Brown', studentId: 'S1004' },
    ],
    classroom2: [
        { id: 'student5', name: 'Eve Davis', studentId: 'S2001' },
        { id: 'student6', name: 'Frank Miller', studentId: 'S2002' },
    ],
    classroom3: [
        { id: 'student7', name: 'Grace Wilson', studentId: 'S3001' },
        { id: 'student8', name: 'Henry Moore', studentId: 'S3002' },
        { id: 'student9', name: 'Ivy Taylor', studentId: 'S3003' },
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
    const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (selectedClassroom) {
            setCurrentStudents(mockStudents[selectedClassroom] || []);
            setAttendanceStatus({}); // Reset attendance when classroom changes
        } else {
            setCurrentStudents([]);
        }
    }, [selectedClassroom]);

    const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmitAttendance = () => {
        if (!selectedClassroom || !selectedDate || !lectureName.trim()) {
            toast({
                title: "Missing Information",
                description: "Please select a classroom, date, and enter a lecture name.",
                variant: "destructive",
            });
            return;
        }
        if (currentStudents.length === 0) {
             toast({
                title: "No Students",
                description: "No students in the selected classroom to mark attendance for.",
                variant: "destructive",
            });
            return;
        }
        if (Object.keys(attendanceStatus).length !== currentStudents.length) {
             toast({
                title: "Incomplete Attendance",
                description: "Please mark attendance for all students.",
                variant: "destructive",
            });
            return;
        }

        const attendanceData = {
            classroomId: selectedClassroom,
            classroomName: mockClassrooms.find(c => c.id === selectedClassroom)?.name,
            date: format(selectedDate, "yyyy-MM-dd"),
            lectureName,
            statuses: attendanceStatus,
        };
        console.log("Submitting Attendance Data:", attendanceData);
        // Logic to submit attendance data to Firestore will go here
        toast({
            title: "Attendance Submitted (Mock)",
            description: `Attendance for ${attendanceData.classroomName} on ${attendanceData.date} for lecture "${lectureName}" has been logged to console.`,
        });
        // Reset form fields or redirect as needed
        // setLectureName('');
        // setAttendanceStatus({});
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
                                        <SelectItem key={cr.id} value={cr.id}>{cr.name} ({cr.subject})</SelectItem>
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
                                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="lectureName">Lecture Name/Topic*</Label>
                            <Input 
                                id="lectureName" 
                                placeholder="e.g., Chapter 5 Review" 
                                value={lectureName}
                                onChange={(e) => setLectureName(e.target.value)}
                            />
                        </div>
                    </div>

                    {selectedClassroom && selectedDate && currentStudents.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Mark Attendance for: {mockClassrooms.find(c=>c.id === selectedClassroom)?.name} on {format(selectedDate, "PPP")}</h3>
                            {!lectureName.trim() && <p className="text-sm text-destructive mb-2">Please enter a lecture name/topic to enable submission.</p>}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.studentId}</TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup 
                                                    value={attendanceStatus[student.id]} 
                                                    onValueChange={(value) => handleStatusChange(student.id, value as 'present' | 'absent')}
                                                    className="flex justify-center gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="present" id={`${student.id}-present`} className="border-green-500 text-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600" />
                                                        <Label htmlFor={`${student.id}-present`} className="text-green-600 flex items-center"><CheckCircle className="mr-1 h-4 w-4"/>Present</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="absent" id={`${student.id}-absent`} className="border-red-500 text-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600" />
                                                        <Label htmlFor={`${student.id}-absent`} className="text-red-600 flex items-center"><XCircle className="mr-1 h-4 w-4"/>Absent</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-6 flex justify-end">
                                <Button 
                                    onClick={handleSubmitAttendance} 
                                    disabled={!lectureName.trim() || Object.keys(attendanceStatus).length !== currentStudents.length}
                                >
                                    Submit Attendance
                                </Button>
                            </div>
                        </div>
                    )}
                     {selectedClassroom && selectedDate && currentStudents.length === 0 && (
                        <p className="text-muted-foreground text-center mt-4">No students found in the selected classroom, or classroom data is loading.</p>
                     )}
                     {!selectedClassroom && (
                        <p className="text-muted-foreground text-center mt-4">Please select a classroom to mark attendance.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
