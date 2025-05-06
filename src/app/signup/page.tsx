
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client'; // Correct import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Removed unused Label import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

// Schema including name, studentId, and major
const signUpSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  studentId: z.string().min(1, { message: 'Student ID is required.' }),
  major: z.string().min(1, { message: 'Major is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      studentId: '',
      major: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);

    // Check if Firebase was initialized correctly
    if (!auth || !db) {
        toast({
            title: 'Initialization Error',
            description: 'Firebase is not configured correctly. Please check the console and environment variables.',
            variant: 'destructive',
        });
        setLoading(false);
        return; // Stop the submission
    }


    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Save additional user data to Firestore
      // Use user.uid as the document ID in the 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        studentId: data.studentId,
        major: data.major,
        email: data.email, // Store email for potential future use
        role: 'student' // Default role, can be changed later by admin
      });

      toast({
        title: 'Sign Up Successful',
        description: 'Your account has been created.',
      });
      router.push('/'); // Redirect to dashboard on successful sign-up
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Provide more specific error messages
       let description = 'An unexpected error occurred. Please try again.';
       if (error.code === 'auth/email-already-in-use') {
           description = 'This email address is already in use.';
       } else if (error.code === 'auth/invalid-email') {
           description = 'Please enter a valid email address.';
       } else if (error.code === 'auth/weak-password') {
           description = 'The password is too weak. Please choose a stronger password.';
       } else if (error.code === 'auth/api-key-not-valid') {
           description = 'Firebase API Key is invalid. Please check your environment configuration.';
       }
      toast({
        title: 'Sign Up Failed',
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
          <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">Create your student account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="text-primary underline hover:text-primary/90">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
