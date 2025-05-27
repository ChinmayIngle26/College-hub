
'use client';

import { useEffect, useState, useActionState } from 'react'; // Changed useFormState to useActionState
// import { useFormState } from 'react-dom'; // Removed
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, AlertTriangle, History, Loader2 } from 'lucide-react';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { LeaveApplication, LeaveApplicationFormData, LeaveType } from '@/types/leave';
import { submitLeaveApplicationAction, type SubmitLeaveApplicationState } from './actions';
import { getLeaveApplicationsByStudentId } from '@/services/leaveApplications';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const leaveTypes: LeaveType[] = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other'];

const leaveApplicationClientSchema = z.object({
  leaveType: z.enum(leaveTypes, { required_error: "Leave type is required."}),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(500, { message: "Reason cannot exceed 500 characters."}),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


const initialFormState: SubmitLeaveApplicationState = { success: false, message: '' };

export default function LeaveApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [formState, formAction, isPending] = useActionState( // Updated to useActionState and isPending
    (prevState: SubmitLeaveApplicationState | null, formData: FormData) => 
      user ? submitLeaveApplicationAction(user.uid, prevState, formData) : Promise.resolve({ success: false, message: "User not authenticated."}),
    initialFormState
  );
  
  const [pastApplications, setPastApplications] = useState<LeaveApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  const form = useForm<LeaveApplicationFormData>({
    resolver: zodResolver(leaveApplicationClientSchema),
    defaultValues: {
      leaveType: undefined,
      startDate: undefined,
      endDate: undefined,
      reason: '',
    },
  });

  useEffect(() => {
    if (formState.success) {
      toast({
        title: 'Success',
        description: formState.message,
        variant: 'default',
      });
      form.reset();
      if (user) fetchPastApplications(user.uid); // Refresh list
    } else if (formState.message && !formState.success && formState.errors === undefined) { // General error
      toast({
        title: 'Error',
        description: formState.message,
        variant: 'destructive',
      });
    }
    // Handle validation errors from server action
    if (formState.errors) {
        formState.errors.forEach(err => {
            form.setError(err.path[0] as keyof LeaveApplicationFormData, { message: err.message });
        });
    }
  }, [formState, form, toast, user]);


  const fetchPastApplications = async (studentId: string) => {
    setLoadingApplications(true);
    try {
      const apps = await getLeaveApplicationsByStudentId(studentId);
      setPastApplications(apps);
    } catch (error) {
      console.error("Failed to fetch past applications", error);
      toast({ title: "Error", description: `Could not load past leave applications. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchPastApplications(user.uid);
    }
  }, [user, authLoading]);


  if (authLoading) {
    return (
      <>
        <MainHeader />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <MainHeader />
        <div className="p-6 text-center">
          <p>Please sign in to apply for leave.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <MainHeader />
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Leave Application
        </h2>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Apply for Leave</CardTitle>
            <CardDescription>Fill out the form below to request a leave of absence.</CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="leaveType">Leave Type</Label>
                   <Select 
                    onValueChange={(value) => form.setValue('leaveType', value as LeaveType, { shouldValidate: true })}
                    defaultValue={form.getValues('leaveType')}
                    name="leaveType"
                    >
                    <SelectTrigger id="leaveType" className={cn(form.formState.errors.leaveType && "border-destructive")}>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.leaveType && <p className="text-sm text-destructive mt-1">{form.formState.errors.leaveType.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="startDate"
                        // name="startDate" // Not needed on button, hidden input handles it
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch('startDate') && "text-muted-foreground",
                           form.formState.errors.startDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('startDate') ? format(form.watch('startDate')!, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('startDate')}
                        onSelect={(date) => form.setValue('startDate', date!, { shouldValidate: true })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.startDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.startDate.message}</p>}
                   <input type="hidden" name="startDate" value={form.watch('startDate')?.toISOString()} />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="endDate"
                        // name="endDate" // Not needed on button, hidden input handles it
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch('endDate') && "text-muted-foreground",
                           form.formState.errors.endDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('endDate') ? format(form.watch('endDate')!, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch('endDate')}
                        onSelect={(date) => form.setValue('endDate', date!, { shouldValidate: true })}
                        disabled={(date) => form.watch('startDate') ? date < form.watch('startDate')! : false }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.endDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.endDate.message}</p>}
                   <input type="hidden" name="endDate" value={form.watch('endDate')?.toISOString()} />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Leave</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Please provide a detailed reason for your leave request (min. 10 characters)."
                  {...form.register('reason')}
                  className={cn(form.formState.errors.reason && "border-destructive")}
                />
                {form.formState.errors.reason && <p className="text-sm text-destructive mt-1">{form.formState.errors.reason.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Submit Application
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Past Leave Applications
            </CardTitle>
            <CardDescription>View the status of your previous leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingApplications ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pastApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.appliedAt ? format(app.appliedAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                        <TableCell>{app.leaveType}</TableCell>
                        <TableCell>{app.startDate ? format(app.startDate.toDate(), 'PPP'): 'N/A'}</TableCell>
                        <TableCell>{app.endDate ? format(app.endDate.toDate(), 'PPP'): 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{app.reason}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            app.status === 'Pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                            app.status === 'Approved' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                            app.status === 'Rejected' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          )}>
                            {app.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No past leave applications found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

