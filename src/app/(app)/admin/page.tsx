
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';


// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

interface UserData {
  id: string;
  name?: string;
  studentId?: string;
  major?: string;
  email?: string;
  role?: string;
  createdAt?: any; // Adjust if using a specific timestamp type
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', studentId: '', major: '', email: '', role: 'student' });
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to complete
    }

    if (!user) {
      router.push('/signin'); // Redirect if not authenticated
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userDataFromDb = userDocSnap.data();
              if (userDataFromDb.role === 'admin') {
                userIsCurrentlyAdmin = true;
              }
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            toast({
              title: "Error",
              description: "Could not verify admin role.",
              variant: "destructive",
            });
          }
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive",
        });
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminAccess();

  }, [user, authLoading, router, toast]);

  const fetchUsers = async () => {
    if (!isAdmin || !db) return;
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsersData(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Could not fetch users data.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]); // removed toast from dependency array as fetchUsers calls it

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingUser) return;
    const { name, value } = e.target;
    setEditingUser(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleCreateUser = async () => {
    if (!db || !isAdmin) return;

    try {
      if (!newUser.name || !newUser.studentId || !newUser.major || !newUser.email || !newUser.role) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields to create a new user.",
          variant: "destructive",
        });
        return;
      }
      // Note: Password for new users created by admin needs a separate mechanism
      // This example assumes users might be created without immediate auth,
      // or they would set their password via a reset flow.
      // For users that need to log in, Firebase Auth creation is separate.
      // This function only creates the Firestore document.
      const usersCollection = collection(db, 'users');
      await addDoc(usersCollection, {
        ...newUser,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "User profile created successfully in Firestore.",
      });
      fetchUsers(); // Refresh users list
      setNewUser({ name: '', studentId: '', major: '', email: '', role: 'student' });
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast({
        title: "Error",
        description: "Could not create user profile. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (userToEdit: UserData) => {
    setEditingUser({ ...userToEdit });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!db || !isAdmin || !editingUser || !editingUser.id) return;

    try {
      if (!editingUser.name || !editingUser.studentId || !editingUser.major || !editingUser.email || !editingUser.role) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }
      const userDocRef = doc(db, 'users', editingUser.id);
      // Destructure to remove 'id' from the object to be updated
      const { id, ...userDataToUpdate } = editingUser;
      await updateDoc(userDocRef, userDataToUpdate);

      toast({
        title: "Success",
        description: "User updated successfully.",
      });
      fetchUsers(); // Refresh users list
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Could not update user. Check console for details.",
        variant: "destructive",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;
    // Consider implications: deleting user from Firestore doesn't delete from Firebase Auth.
    // Proper user deletion often involves backend functions to handle both.
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);

      toast({
        title: "Success",
        description: "User profile deleted successfully from Firestore.",
      });
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error("Error deleting user profile:", error);
      toast({
        title: "Error",
        description: "Could not delete user profile. Check console for details.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="p-6">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
              <CardTitle>Loading Admin Panel...</CardTitle>
              <CardDescription>Please wait while we verify your access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback:
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>Manage users and system settings.</CardDescription>
        </CardHeader>
      </Card>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </CardTitle>
          <CardDescription>View, add, edit, or remove user profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {usersData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Major</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {usersData.map((u) => (
                        <tr key={u.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{u.name || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.studentId || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.email || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.major || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.role || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(u)} className="mr-2 text-primary hover:text-primary/80">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the profile for {u.name || u.email}? This action cannot be undone.
                                    This only deletes the Firestore document, not the Firebase Auth user.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button variant="destructive" onClick={() => handleDeleteUser(u.id)}>
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No user profiles found.</p>
              )}

              {/* Add New User Form */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5" /> Add New User Profile
                  </CardTitle>
                  <CardDescription>Create a new user profile in Firestore. Note: This does not create a Firebase Auth user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="newUserName">Full Name</Label>
                      <Input id="newUserName" name="name" value={newUser.name} onChange={handleInputChange} placeholder="John Doe" />
                    </div>
                    <div>
                      <Label htmlFor="newUserStudentId">Student ID</Label>
                      <Input id="newUserStudentId" name="studentId" value={newUser.studentId} onChange={handleInputChange} placeholder="S12345" />
                    </div>
                    <div>
                      <Label htmlFor="newUserEmail">Email</Label>
                      <Input id="newUserEmail" name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="user@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="newUserMajor">Major</Label>
                      <Input id="newUserMajor" name="major" value={newUser.major} onChange={handleInputChange} placeholder="Computer Science" />
                    </div>
                     <div>
                        <Label htmlFor="newUserRole">Role</Label>
                        <select
                            id="newUserRole"
                            name="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                        >
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                            {/* Add other roles as needed */}
                        </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateUser} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Create User Profile
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
              <DialogDescription>Modify the details for this user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editUserName">Full Name</Label>
                <Input id="editUserName" name="name" value={editingUser.name || ''} onChange={handleEditInputChange} />
              </div>
              <div>
                <Label htmlFor="editUserStudentId">Student ID</Label>
                <Input id="editUserStudentId" name="studentId" value={editingUser.studentId || ''} onChange={handleEditInputChange} />
              </div>
              <div>
                <Label htmlFor="editUserEmail">Email</Label>
                <Input id="editUserEmail" name="email" type="email" value={editingUser.email || ''} onChange={handleEditInputChange} />
              </div>
              <div>
                <Label htmlFor="editUserMajor">Major</Label>
                <Input id="editUserMajor" name="major" value={editingUser.major || ''} onChange={handleEditInputChange} />
              </div>
               <div>
                <Label htmlFor="editUserRole">Role</Label>
                <select
                    id="editUserRole"
                    name="role"
                    value={editingUser.role || 'student'}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value }) : null)}
                    className="mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}>Cancel</Button>
              <Button onClick={handleUpdateUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


      {/* System Settings Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" /> System Settings
          </CardTitle>
          <CardDescription>Configure application-wide settings and parameters.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">System settings configuration will be available here.</p>
          {/* Example:
          <Button onClick={() => router.push('/admin/settings')}>
            Configure Settings
          </Button>
          */}
        </CardContent>
      </Card>

      {/* Content Management Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Manage announcements, calendar events, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Content management tools will be available here.</p>
          {/* Example:
          <Button>Manage Content</Button>
          */}
        </CardContent>
      </Card>
    </div>
  );
}
