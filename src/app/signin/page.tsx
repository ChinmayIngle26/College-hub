
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client'; // Correct import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Removed unused Label import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';


const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

// Helper function to set a cookie
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  if (typeof document !== 'undefined') { // Ensure document is available (client-side)
      document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
}


export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);

    if (!auth || !db) {
        toast({
            title: 'Initialization Error',
            description: 'Firebase Auth is not configured correctly. Please check the console and environment variables.',
            variant: 'destructive',
        });
        setLoading(false);
        return; 
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      setCookie('firebaseAuthToken', idToken, 1); 

      let userRole = 'student'; // Default role
      const ADMIN_EMAIL = "admin@gmail.com";

      if (user.email === ADMIN_EMAIL) {
        userRole = 'admin';
      } else {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === 'admin') {
            userRole = 'admin';
          } else if (userData.role === 'faculty') {
            userRole = 'faculty';
          }
          // If role is 'student' or undefined, it remains 'student'
        } else {
          // If no user document, they might be a new user who hasn't completed profile setup
          // or an issue with data sync. Default to student role.
          console.warn(`User document not found for UID: ${user.uid} during sign-in. Defaulting to student role for redirection.`);
        }
      }

      toast({
        title: 'Sign In Successful',
        description: 'Welcome back!',
      });

      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'faculty') {
        router.push('/faculty');
      } else {
        router.push('/'); 
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Please enter a valid email address.';
      } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Firebase API Key is invalid. Please check your environment configuration.';
       } else if (error.code === 'auth/network-request-failed') {
            description = 'Network error. Please check your internet connection.';
       }
      toast({
        title: 'Sign In Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary underline hover:text-primary/90">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
