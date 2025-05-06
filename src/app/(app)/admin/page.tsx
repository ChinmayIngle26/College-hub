'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [usersData, setUsersData] = useState([]);
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

    // Check if the user is an admin
    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      // Condition 1: User's email is the hardcoded admin email
      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        // Condition 2: User has 'admin' role in Firestore
        // This check is performed only if the email doesn't match ADMIN_EMAIL
        if (db) { // Ensure db is initialized
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              if (userData.role === 'admin') {
                userIsCurrentlyAdmin = true;
              }
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            // Keep userIsCurrentlyAdmin as false, error means no admin role found via DB
          }
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        // If user is not admin by either condition, redirect
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminAccess();

  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin || !db) return;
      setLoadingUsers(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersData(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async () => {
    if (!db || !isAdmin) return;

    try {
      // Basic validation - enhance as needed
      if (!newUser.name || !newUser.studentId || !newUser.major || !newUser.email) {
        alert("Please fill in all fields to create a new user.");
        return;
      }

      // Add new user to Firebase (Firestore)
      const usersCollection = collection(db, 'users');
      await addDoc(usersCollection, {
        ...newUser,
        role: 'student' // Default role for new users
      });

      // Refresh users list after successful creation
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersData(usersList);

      // Clear the new user input fields
      setNewUser({ name: '', studentId: '', major: '', email: '' });
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Could not create user. Please check console for details.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;

    try {
      // Delete user from Firestore
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);

      // Refresh users list after successful deletion
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersData(usersList);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Could not delete user. Please check console for details.");
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
    // This state should ideally be handled by the redirect,
    // but as a fallback or if redirect hasn't completed:
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

  // Render Admin Panel if user is admin
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admin Panel
          </h2>
        </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Example Card: User Management */}
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
                <p>Loading users...</p>
              ) : (
                <>
                  {/* List of Users */}
                  <ul>
                    {usersData.map(user => (
                      <li key={user.id} className="flex items-center justify-between py-2 border-b">
                        <span>{user.name} ({user.email})</span>
                        <div>
                          <Button variant="ghost" size="icon" onClick={() => alert('Edit functionality not implemented.')}> {/*  Implement edit functionality */}
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Add New User Form */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Add New User</h4>
                    <Input
                      type="text"
                      placeholder="Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Student ID"
                      value={newUser.studentId}
                      onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Major"
                      value={newUser.major}
                      onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <Button onClick={handleCreateUser} className="mt-2">Create User</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Example Card: System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                System Settings
              </CardTitle>
              <CardDescription>Configure application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => alert('Settings configuration not implemented.')}> {/* Implement settings configuration */}
                Configure Settings
              </Button>
            </CardContent>
          </Card>

          {/* Add more admin feature cards as needed */}
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Manage announcements, calendar, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => alert('Content management not implemented.')}> {/* Implement content management functionality */}
                Manage Content
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
