
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
import { CalendarIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getClassroomsByFaculty, getStudentsInClassroom } from '@/services/classroomService';
import { submitLectureAttendance } from '@/services/attendance';
import type { Classroom, ClassroomStudent } from '@/types/classroom';
import type { LectureAttendanceRecord } from '@/types/lectureAttendance';
import { Skeleton } from '@/components/ui/skeleton';

type StudentAttendanceStatus = {
    [studentId: string]: 'present' | 'absent' | undefined;
};

export default function FacultyAttendancePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loadingClassrooms, setLoadingClassrooms] = useState(true);
    const [selectedClassroom, setSelectedClassroom] = useState<string | undefined>();
    
    const [currentStudents, setCurrentStudents] = useState<ClassroomStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [lectureSubjectTopic, setLectureSubjectTopic] = useState<string>(''); // Renamed from lectureName
    const [attendanceStatus, setAttendanceStatus] = useState<StudentAttendanceStatus>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
          fetchFacultyClassrooms();
        }
    }, [user, authLoading]);

    const fetchFacultyClassrooms = async () => {
        if (!user) return;
        setLoadingClassrooms(true);
        try {
          // This service now fetches classrooms where user is owner OR invited
          const fetchedClassrooms = await getClassroomsByFaculty(user.uid);
          setClassrooms(fetchedClassrooms);
        } catch (error) {
          toast({ title: "Error", description: "Could not load your classrooms.", variant: "destructive" });
        } finally {
          setLoadingClassrooms(false);
        }
    };

    useEffect(() => {
        if (selectedClassroom) {
            fetchStudentsForClassroom(selectedClassroom);
        } else {
            setCurrentStudents([]);
        }
        setAttendanceStatus({}); 
    }, [selectedClassroom]);

    const fetchStudentsForClassroom = async (classroomId: string) => {
        setLoadingStudents(true);
        try {
            const students = await getStudentsInClassroom(classroomId);
            setCurrentStudents(students);
        } catch (error) {
            toast({ title: "Error", description: "Could not load students for this classroom.", variant: "destructive" });
            setCurrentStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmitAttendance = async () => {
        if (!user || !user.displayName) { // Ensure user.displayName is available
            toast({ title: "Error", description: "User details not available. Cannot submit attendance.", variant: "destructive" });
            return;
        }
        if (!selectedClassroom || !selectedDate || !lectureSubjectTopic.trim()) {
            toast({ title: "Missing Information", description: "Please select classroom, date, and enter Subject/Topic.", variant: "destructive" });
            return;
        }
        if (currentStudents.length === 0) {
             toast({ title: "No Students", description: "No students in selected classroom.", variant: "destructive" });
            return;
        }
        const unmarkedStudents = currentStudents.filter(s => !attendanceStatus[s.id]);
        if (unmarkedStudents.length > 0) {
             toast({ title: "Incomplete Attendance", description: `Please mark for all students (${unmarkedStudents.length} remaining).`, variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const classroomDetails = classrooms.find(c => c.id === selectedClassroom);
        if (!classroomDetails) {
            toast({ title: "Error", description: "Selected classroom details not found.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const recordsToSubmit: Omit<LectureAttendanceRecord, 'id' | 'submittedAt'>[] = currentStudents.map(student => ({
            classroomId: selectedClassroom,
            classroomName: classroomDetails.name,
            facultyId: user.uid, // UID of faculty taking attendance
            facultyName: user.displayName || 'Faculty', // Name of faculty
            date: format(selectedDate, "yyyy-MM-dd"),
            lectureName: lectureSubjectTopic, // This is now Subject/Topic
            studentId: student.id, 
            studentName: student.name,
            status: attendanceStatus[student.id]!, 
        }));

        try {
            await submitLectureAttendance(recordsToSubmit);
            toast({
                title: "Attendance Submitted",
                description: `Attendance for ${classroomDetails.name} on ${format(selectedDate, "PPP")} for "${lectureSubjectTopic}" saved.`,
            });
        } catch (error) {
            console.error("Error submitting attendance:", error);
            toast({ title: "Submission Failed", description: (error as Error).message || "Could not save attendance.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

  if (authLoading) {
    return ( <> <MainHeader />
            <div className="space-y-6"><Skeleton className="h-12 w-1/2" /><Card><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
        </> );
  }

  return (
    <>
        <MainHeader />
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Update Attendance</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Record Lecture Attendance</CardTitle>
                    <CardDescription>Select classroom, date, and subject/topic to mark attendance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="classroom">Select Classroom</Label>
                            {loadingClassrooms ? <Skeleton className="h-10 w-full" /> : (
                                <Select value={selectedClassroom} onValueChange={setSelectedClassroom} disabled={classrooms.length === 0}>
                                    <SelectTrigger id="classroom"><SelectValue placeholder={classrooms.length > 0 ? "Choose a classroom" : "No classrooms assigned"} /></SelectTrigger>
                                    <SelectContent>{classrooms.map(cr => (<SelectItem key={cr.id} value={cr.id}>{cr.name} ({cr.subject})</SelectItem>))}</SelectContent>
                                </Select>)}
                        </div>
                        <div>
                            <Label htmlFor="date">Select Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!selectedDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="lectureSubjectTopic">Subject / Lecture Topic*</Label>
                            <Input id="lectureSubjectTopic" placeholder="e.g., Physics - Chapter 5" value={lectureSubjectTopic} onChange={(e) => setLectureSubjectTopic(e.target.value)}/>
                        </div>
                    </div>

                    {loadingStudents && selectedClassroom && (<div className="mt-6 flex items-center justify-center space-x-2"><Loader2 className="h-5 w-5 animate-spin" /> <span>Loading students...</span></div>)}

                    {!loadingStudents && selectedClassroom && selectedDate && currentStudents.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Mark Attendance for: {classrooms.find(c=>c.id === selectedClassroom)?.name} on {format(selectedDate, "PPP")}</h3>
                            {!lectureSubjectTopic.trim() && <p className="text-sm text-destructive mb-2">Please enter a Subject/Topic to enable submission.</p>}
                            <Table>
                                <TableHeader><TableRow><TableHead>Student ID</TableHead><TableHead>Student Name</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {currentStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.studentIdNumber}</TableCell><TableCell>{student.name}</TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup value={attendanceStatus[student.id]} onValueChange={(value) => handleStatusChange(student.id, value as 'present' | 'absent')} className="flex justify-center gap-4">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="present" id={`${student.id}-present`} className="border-green-500 text-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600" /><Label htmlFor={`${student.id}-present`} className="text-green-600 flex items-center"><CheckCircle className="mr-1 h-4 w-4"/>Present</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="absent" id={`${student.id}-absent`} className="border-red-500 text-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600" /><Label htmlFor={`${student.id}-absent`} className="text-red-600 flex items-center"><XCircle className="mr-1 h-4 w-4"/>Absent</Label></div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>))}
                                </TableBody>
                            </Table>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSubmitAttendance} disabled={isSubmitting || !lectureSubjectTopic.trim() || currentStudents.filter(s => !attendanceStatus[s.id]).length > 0}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Attendance
                                </Button>
                            </div>
                        </div>)}
                     {!loadingStudents && selectedClassroom && selectedDate && currentStudents.length === 0 && (<p className="text-muted-foreground text-center mt-4">No students found in this classroom. Add students via 'Manage Classrooms'.</p>)}
                     {!selectedClassroom && classrooms.length > 0 && (<p className="text-muted-foreground text-center mt-4">Please select a classroom.</p>)}
                     {!loadingClassrooms && classrooms.length === 0 && (<p className="text-muted-foreground text-center mt-4">No classrooms assigned. Create one in 'Manage Classrooms'.</p>)}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
