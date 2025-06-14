
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Mock data for now
const mockClassrooms = [
    { id: 'classroom1', name: 'CS101 - Section A', studentCount: 30, subject: 'Introduction to Programming' },
    { id: 'classroom2', name: 'MA205 - Morning Batch', studentCount: 25, subject: 'Calculus II' },
];

export default function FacultyClassroomsPage() {
  return (
    <>
        <MainHeader />
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Manage Classrooms
                </h2>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Classroom
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Classrooms</CardTitle>
                    <CardDescription>View and manage your existing classrooms, or create new ones.</CardDescription>
                </CardHeader>
                <CardContent>
                    {mockClassrooms.length > 0 ? (
                        <div className="space-y-4">
                            {mockClassrooms.map(classroom => (
                                <Card key={classroom.id} className="shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-medium">{classroom.name}</CardTitle>
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Subject: {classroom.subject}</p>
                                        <p className="text-sm text-muted-foreground">Students: {classroom.studentCount}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-2">You haven't created any classrooms yet.</p>
                            <Button variant="default">
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Classroom
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Further implementation for classroom creation modal and management views will go here */}
        </div>
    </>
  );
}
