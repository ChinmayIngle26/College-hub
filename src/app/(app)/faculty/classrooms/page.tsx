
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Users, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClassroom, getClassroomsByFaculty } from '@/services/classroomService';
import type { Classroom } from '@/types/classroom';
import { Skeleton } from '@/components/ui/skeleton';

export default function FacultyClassroomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomSubject, setNewClassroomSubject] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      fetchClassrooms();
    } else if (!authLoading && !user) {
      setLoadingClassrooms(false);
      // Handle not logged in state if necessary, though layout should redirect
    }
  }, [user, authLoading]);

  const fetchClassrooms = async () => {
    if (!user) return;
    setLoadingClassrooms(true);
    try {
      const fetchedClassrooms = await getClassroomsByFaculty(user.uid);
      setClassrooms(fetchedClassrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast({ title: "Error", description: "Could not load classrooms.", variant: "destructive" });
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const handleCreateClassroom = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!newClassroomName.trim() || !newClassroomSubject.trim()) {
      toast({ title: "Validation Error", description: "Name and subject are required.", variant: "destructive" });
      return;
    }
    try {
      await createClassroom(newClassroomName, newClassroomSubject, user.uid);
      toast({ title: "Success", description: `Classroom "${newClassroomName}" created.` });
      setIsCreateModalOpen(false);
      setNewClassroomName('');
      setNewClassroomSubject('');
      fetchClassrooms(); // Refresh list
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast({ title: "Creation Failed", description: "Could not create classroom.", variant: "destructive" });
    }
  };

  if (authLoading || loadingClassrooms) {
    return (
        <>
            <MainHeader />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="mt-2 h-4 w-72" /></CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i}><CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader><CardContent><Skeleton className="h-4 w-3/4" /><Skeleton className="mt-1 h-4 w-1/2" /></CardContent></Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    )
  }

  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Manage Classrooms
          </h2>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Classroom</DialogTitle>
                <DialogDescription>Enter the details for your new classroom.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="classroomName" className="text-right">Name</Label>
                  <Input id="classroomName" value={newClassroomName} onChange={(e) => setNewClassroomName(e.target.value)} className="col-span-3" placeholder="e.g., CS101 - Section A" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="classroomSubject" className="text-right">Subject</Label>
                  <Input id="classroomSubject" value={newClassroomSubject} onChange={(e) => setNewClassroomSubject(e.target.value)} className="col-span-3" placeholder="e.g., Introduction to Programming" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreateClassroom}>Create Classroom</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Classrooms</CardTitle>
            <CardDescription>View and manage your existing classrooms.</CardDescription>
          </CardHeader>
          <CardContent>
            {classrooms.length > 0 ? (
              <div className="space-y-4">
                {classrooms.map(classroom => (
                  <Card key={classroom.id} className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-medium">{classroom.name}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => toast({description: "Manage classroom (Not implemented yet)."})}>
                        <Edit className="mr-2 h-3 w-3" /> Manage Students
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Subject: {classroom.subject}</p>
                      <p className="text-sm text-muted-foreground">Students: {classroom.studentIds?.length || 0}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mt-2 mb-2">You haven&apos;t created any classrooms yet.</p>
                <Button variant="default" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Classroom
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
