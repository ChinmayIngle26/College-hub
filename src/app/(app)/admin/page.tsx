
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast'; // Added useToast import

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
  const { toast } = useToast(); // Initialize useToast
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', studentId: '', major: '', email: '' });

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
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminAccess();

  }, [user, authLoading, router, toast]);

  useEffect(() => {
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

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, toast]);

  const handleCreateUser = async () => {
    if (!db || !isAdmin) return;

    try {
      if (!newUser.name || !newUser.studentId || !newUser.major || !newUser.email) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields to create a new user.",
          variant: "destructive",
        });
        return;
      }

      const usersCollection = collection(db, 'users');
      await addDoc(usersCollection, {
        ...newUser,
        role: 'student',
        createdAt: serverTimestamp(), // Add a timestamp
      });

      toast({
        title: "Success",
        description: "User created successfully.",
      });

      // Refresh users list
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsersData(usersList);

      setNewUser({ name: '', studentId: '', major: '', email: '' });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Could not create user. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });

      // Refresh users list
      setUsersData(usersData.filter(u => u.id !== userId));

    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Could not delete user. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || checkingRole) {
    return (
      <>
        <MainHeader />
        <div className="space-y-6 p-6 md:p-8 lg:p-10">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <MainHeader />
        <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
          <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admin Panel
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>View, add, edit, or remove users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  {usersData.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {usersData.map(u => (
                        <li key={u.id} className="flex items-center justify-between py-2 border-b">
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name || 'N/A'}</span>
                            <span className="text-sm text-muted-foreground">{u.email || 'N/A'}</span>
                          </div>
                          <div>
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "Info", description: "Edit functionality not implemented." })}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDeleteUser(u.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No users found.</p>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-md font-semibold mb-3">Add New User</h4>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="mb-2" // Added margin
                      />
                      <Input
                        type="text"
                        placeholder="Student ID"
                        value={newUser.studentId}
                        onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                        className="mb-2" // Added margin
                      />
                      <Input
                        type="text"
                        placeholder="Major"
                        value={newUser.major}
                        onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                        className="mb-2" // Added margin
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="mb-2" // Added margin
                      />
                      <Button onClick={handleCreateUser} className="w-full mt-2">
                         <UserPlus className="mr-2 h-4 w-4" /> Create User
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                System Settings
              </CardTitle>
              <CardDescription>Configure application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => toast({ title: "Info", description: "Settings configuration not implemented." })}>
                Configure Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Manage announcements, calendar, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => toast({ title: "Info", description: "Content management not implemented." })}>
                Manage Content
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
