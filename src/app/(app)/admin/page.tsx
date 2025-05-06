'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
      
        
          
            
              
                
                
                
              
            
          
        
      
    );
  }

  if (!isAdmin) {
    return (
      
        
          
          Access Denied
          You do not have permission to view this page.
          Go to Dashboard
        
      
    );
  }

  return (
    
      
        
          Admin Panel
          
        

        
          
            
              
                
                User Management
              
              View, add, edit, or remove users.
            
            
              {loadingUsers ? (
                
                  
                  
                  
                
              ) : (
                <>
                  {usersData.length > 0 ? (
                    
                      {usersData.map(u => (
                        
                          
                            
                              {u.name || 'N/A'}
                            
                            {u.email || 'N/A'}
                          
                          
                            
                              
                            
                            
                              
                            
                          
                        
                      ))}
                    
                  ) : (
                    No users found.
                  )}

                  
                    
                       Add New User
                      
                      
                        
                          
                          
                        
                        
                          
                          
                        
                        
                          
                          
                        
                        
                          
                          
                        
                        
                           Create User
                        
                      
                    
                  
                </>
              )}
            
          

          
            
              
                System Settings
              
              Configure application settings.
            
            
              
                Configure Settings
              
            
          

          
            
              Content Management
            
            Manage announcements, calendar, etc.
          
          
            
              
                Manage Content
              
            
          

        
      
    
  );
}

