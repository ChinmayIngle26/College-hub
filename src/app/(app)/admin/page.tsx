
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert, Edit, Trash2, CheckCircle } from 'lucide-react';
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
  parentEmail?: string; // Added parentEmail
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
  const [newUser, setNewUser] = useState({ name: '', studentId: '', major: '', email: '', parentEmail: '', role: 'student' }); // Added parentEmail
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to complete
    }

    if (!user) {
      router.push('/signin'); // Redirect if not authenticated
      setCheckingRole(false); // Ensure checkingRole is set if user is null
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      // First, check the hardcoded admin email
      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        // If not the hardcoded email, check Firestore role
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
              description: "Could not verify admin role. Please check Firestore permissions.",
              variant: "destructive",
            });
            // Fall through to potentially redirect if not admin
          }
        } else {
             toast({
                title: "Database Error",
                description: "Firestore is not available. Cannot verify admin role.",
                variant: "destructive",
            });
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
    // Ensure db is available and user is admin before fetching
    if (!db || !isAdmin) {
        if (!isAdmin && !checkingRole) { // Only log if not admin and role check is complete
             console.log("User is not admin, skipping fetchUsers.");
        }
        if (!db) {
            console.error("Firestore DB instance is not available in fetchUsers.");
        }
        setLoadingUsers(false); // Ensure loading state is turned off
        return;
    }
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsersData(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error Fetching Users",
        description: "Could not fetch users data. Ensure Firestore rules allow 'list' operation on 'users' collection for admins.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) { // Fetch users only if isAdmin is true and checks are done
      fetchUsers();
    }
  }, [isAdmin, authLoading, checkingRole]);


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
      if (!newUser.name || !newUser.studentId || !newUser.major || !newUser.email || !newUser.parentEmail || !newUser.role) { // Added parentEmail check
        toast({
          title: "Validation Error",
          description: "Please fill in all fields to create a new user.",
          variant: "destructive",
        });
        return;
      }
      // Basic email validation (can be more robust)
      if (!/\S+@\S+\.\S+/.test(newUser.email) || !/\S+@\S+\.\S+/.test(newUser.parentEmail)) {
        toast({
          title: "Validation Error",
          description: "Please enter valid email addresses.",
          variant: "destructive",
        });
        return;
      }
      const usersCollection = collection(db, 'users');
      // Admin can create users. Firestore rules should allow this.
      await addDoc(usersCollection, {
        ...newUser,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "User profile created successfully in Firestore.",
      });
      fetchUsers(); // Refresh users list
      setNewUser({ name: '', studentId: '', major: '', email: '', parentEmail: '', role: 'student' }); // Reset parentEmail
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast({
        title: "Error Creating User",
        description: "Could not create user profile. Ensure Firestore rules allow 'create' on 'users' for admins.",
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
      if (!editingUser.name || !editingUser.studentId || !editingUser.major || !editingUser.email || !editingUser.parentEmail || !editingUser.role) { // Added parentEmail check
        toast({
          title: "Validation Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }
      // Basic email validation
      if (!/\S+@\S+\.\S+/.test(editingUser.email) || (editingUser.parentEmail && !/\S+@\S+\.\S+/.test(editingUser.parentEmail))) {
        toast({
          title: "Validation Error",
          description: "Please enter valid email addresses.",
          variant: "destructive",
        });
        return;
      }

      const userDocRef = doc(db, 'users', editingUser.id);
      const { id, ...userDataToUpdate } = editingUser;
      // Admin can update users. Firestore rules should allow this.
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
        title: "Error Updating User",
        description: "Could not update user. Ensure Firestore rules allow 'update' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      // Admin can delete users. Firestore rules should allow this.
      await deleteDoc(userDocRef);

      toast({
        title: "Success",
        description: "User profile deleted successfully from Firestore.",
      });
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error("Error deleting user profile:", error);
      toast({
        title: "Error Deleting User",
        description: "Could not delete user profile. Ensure Firestore rules allow 'delete' on 'users' for admins.",
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Parent's Email</th> {/* New Column Header */}
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
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.parentEmail || 'N/A'}</td> {/* New Column Data */}
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
                <p className="text-center text-muted-foreground">No user profiles found. Ensure Firestore rules allow listing users for admins.</p>
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
                    <div> {/* New Parent's Email Field */}
                      <Label htmlFor="newUserParentEmail">Parent's Email</Label>
                      <Input id="newUserParentEmail" name="parentEmail" type="email" value={newUser.parentEmail} onChange={handleInputChange} placeholder="parent@example.com" />
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
              <div> {/* New Parent's Email Field for Edit */}
                <Label htmlFor="editUserParentEmail">Parent's Email</Label>
                <Input id="editUserParentEmail" name="parentEmail" type="email" value={editingUser.parentEmail || ''} onChange={handleEditInputChange} />
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
          <Button onClick={() => router.push('/admin/settings')} className="mt-2">
            Configure Settings
          </Button>
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

