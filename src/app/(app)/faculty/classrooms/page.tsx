
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Users, Edit, UserPlus, LinkIcon, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClassroom, getClassroomsByFaculty, addInvitedFacultyToClassroom, getAllFacultyUsers } from '@/services/classroomService';
import type { Classroom, FacultyUser } from '@/types/classroom';
import { Skeleton } from '@/components/ui/skeleton';

export default function FacultyClassroomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomSubject, setNewClassroomSubject] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [classroomToInviteTo, setClassroomToInviteTo] = useState<Classroom | null>(null);
  const [allFaculty, setAllFaculty] = useState<FacultyUser[]>([]);
  const [selectedFacultyToInvite, setSelectedFacultyToInvite] = useState<string | undefined>();
  const [loadingAllFaculty, setLoadingAllFaculty] = useState(false);


  useEffect(() => {
    if (user && !authLoading) {
      fetchClassrooms();
    } else if (!authLoading && !user) {
      setLoadingClassrooms(false);
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
      fetchClassrooms(); 
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast({ title: "Creation Failed", description: (error as Error).message || "Could not create classroom.", variant: "destructive" });
    }
  };

  const openInviteModal = async (classroom: Classroom) => {
    setClassroomToInviteTo(classroom);
    setIsInviteModalOpen(true);
    setLoadingAllFaculty(true);
    try {
        const facultyList = await getAllFacultyUsers();
        // Filter out the current user (owner) and already invited faculty
        const ownerId = user?.uid;
        const alreadyInvitedIds = classroom.invitedFacultyIds || [];
        const eligibleFaculty = facultyList.filter(f => f.uid !== ownerId && !alreadyInvitedIds.includes(f.uid));
        setAllFaculty(eligibleFaculty);
    } catch (error) {
        toast({ title: "Error", description: "Could not load faculty list for inviting.", variant: "destructive" });
        setAllFaculty([]);
    } finally {
        setLoadingAllFaculty(false);
    }
  };

  const handleInviteFaculty = async () => {
    if (!user || !classroomToInviteTo || !selectedFacultyToInvite) {
        toast({ title: "Error", description: "Missing information for invite.", variant: "destructive" });
        return;
    }
    try {
        await addInvitedFacultyToClassroom(classroomToInviteTo.id, user.uid, selectedFacultyToInvite);
        toast({ title: "Success", description: `Faculty invited to ${classroomToInviteTo.name}.` });
        setIsInviteModalOpen(false);
        setSelectedFacultyToInvite(undefined);
        fetchClassrooms(); // Refresh to show updated invited list potentially
    } catch (error) {
        toast({ title: "Invite Failed", description: (error as Error).message || "Could not invite faculty.", variant: "destructive" });
    }
  };


  if (authLoading || (loadingClassrooms && !user)) { // Show skeleton if auth is loading OR (classrooms are loading AND user isn't determined yet)
    return (
        <> <MainHeader />
            <div className="space-y-6">
                <div className="flex items-center justify-between"><Skeleton className="h-9 w-64" /><Skeleton className="h-10 w-48" /></div>
                <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="mt-2 h-4 w-72" /></CardHeader>
                    <CardContent className="space-y-4">{[...Array(2)].map((_, i) => (
                            <Card key={i}><CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader><CardContent><Skeleton className="h-4 w-3/4" /><Skeleton className="mt-1 h-4 w-1/2" /></CardContent></Card>))}</CardContent>
                </Card></div></>);
  }
  
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Manage Classrooms</h2>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Classroom</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Classroom</DialogTitle><DialogDescription>Enter details for your new classroom.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="classroomName" className="text-right">Name</Label><Input id="classroomName" value={newClassroomName} onChange={(e) => setNewClassroomName(e.target.value)} className="col-span-3" placeholder="e.g., CS101 - Section A" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="classroomSubject" className="text-right">Subject/Desc</Label><Input id="classroomSubject" value={newClassroomSubject} onChange={(e) => setNewClassroomSubject(e.target.value)} className="col-span-3" placeholder="e.g., Data Structures (Fall 2024)" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleCreateClassroom}>Create Classroom</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Your Classrooms</CardTitle><CardDescription>View, manage, and invite faculty to your classrooms.</CardDescription></CardHeader>
          <CardContent>
            {loadingClassrooms && user ? <Skeleton className="h-40 w-full" /> : classrooms.length > 0 ? (
              <div className="space-y-4">
                {classrooms.map(classroom => (
                  <Card key={classroom.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <CardTitle className="text-base font-medium">{classroom.name}</CardTitle>
                        <div className="flex gap-2">
                           {user && classroom.ownerFacultyId === user.uid && (
                             <Button variant="outline" size="sm" onClick={() => openInviteModal(classroom)}>
                               <LinkIcon className="mr-2 h-3 w-3" /> Invite Faculty
                             </Button>
                           )}
                           <Button variant="outline" size="sm" onClick={() => toast({description: "Manage students (Not implemented yet)."})}>
                             <Users className="mr-2 h-3 w-3" /> Manage Students
                           </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Description: {classroom.subject}</p>
                      <p className="text-sm text-muted-foreground">Owner: {classroom.ownerFacultyId === user?.uid ? 'You' : classroom.ownerFacultyId}</p>
                      <p className="text-sm text-muted-foreground">Invited Faculty: {classroom.invitedFacultyIds?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Students: {classroom.studentIds?.length || 0}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mt-2 mb-2">You are not part of any classrooms yet.</p>
                <Button variant="default" onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Create Your First Classroom</Button>
              </div>)}
          </CardContent>
        </Card>

        {/* Invite Faculty Modal */}
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Faculty to {classroomToInviteTo?.name}</DialogTitle>
                    <DialogDescription>Select a faculty member to invite to this classroom. They will be able to take attendance.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loadingAllFaculty ? <Skeleton className="h-10 w-full" /> : allFaculty.length > 0 ? (
                        <Select value={selectedFacultyToInvite} onValueChange={setSelectedFacultyToInvite}>
                            <SelectTrigger><SelectValue placeholder="Select faculty to invite" /></SelectTrigger>
                            <SelectContent>
                                {allFaculty.map(f => (
                                    <SelectItem key={f.uid} value={f.uid}>{f.name} ({f.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-muted-foreground">No other faculty available to invite or all eligible faculty already invited.</p>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" onClick={() => setSelectedFacultyToInvite(undefined)}>Cancel</Button></DialogClose>
                    <Button onClick={handleInviteFaculty} disabled={!selectedFacultyToInvite || loadingAllFaculty}>Invite to Classroom</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
