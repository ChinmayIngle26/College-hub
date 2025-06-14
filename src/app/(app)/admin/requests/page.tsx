
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle, XCircle, Edit, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { ProfileChangeRequest } from '@/types/profile-change-request';
import { getProfileChangeRequests, approveProfileChangeRequest, denyProfileChangeRequest } from '@/services/profile-change-requests';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_EMAIL = "admin@gmail.com";

export default function AdminRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);
  const [denialReason, setDenialReason] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      setCheckingRole(false);
      return;
    }
    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;
      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else if (db) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
            userIsCurrentlyAdmin = true;
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          toast({ title: "Error", description: "Could not verify admin role.", variant: "destructive" });
        }
      }
      if (userIsCurrentlyAdmin) setIsAdmin(true);
      else {
        toast({ title: "Access Denied", description: "You do not have permission.", variant: "destructive" });
        router.push('/');
      }
      setCheckingRole(false);
    };
    checkAdminAccess();
  }, [user, authLoading, router, toast]);

  const fetchRequests = async () => {
    if (!isAdmin) return;
    setLoadingRequests(true);
    try {
      const fetchedRequests = await getProfileChangeRequests(); // Using mock service for now
      setRequests(fetchedRequests.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({ title: "Error Fetching Requests", description: "Could not load change requests.", variant: "destructive" });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) {
      fetchRequests();
    }
  }, [isAdmin, authLoading, checkingRole]);

  const handleApprove = async (request: ProfileChangeRequest) => {
    // Placeholder: In future, this will call the service to update Firestore
    toast({ title: "Approving Request (Placeholder)", description: `Request ID: ${request.id} for ${request.fieldName} would be approved.` });
    // await approveProfileChangeRequest(request.id, request.userId, request.fieldName, request.newValue);
    // For UI update with mock data:
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'approved', resolvedAt: new Date(), adminNotes: 'Approved via UI' } : r));
  };

  const handleDeny = async (request: ProfileChangeRequest) => {
    // Placeholder: In future, this will call the service to update Firestore
    if (!denialReason.trim()) {
        toast({ title: "Reason Required", description: "Please provide a reason for denial.", variant: "destructive" });
        return;
    }
    toast({ title: "Denying Request (Placeholder)", description: `Request ID: ${request.id} for ${request.fieldName} would be denied. Reason: ${denialReason}` });
    // await denyProfileChangeRequest(request.id, denialReason);
    // For UI update with mock data:
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'denied', resolvedAt: new Date(), adminNotes: denialReason } : r));
    setSelectedRequest(null);
    setDenialReason('');
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg"><CardHeader><CardTitle>Loading...</CardTitle></CardHeader></Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  const renderValue = (value: any) => {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs inline-block">{value}</a>;
    }
    if (value instanceof Date) {
        return format(value, 'PPP p');
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6" /> Profile Change Requests
          </CardTitle>
          <CardDescription>Review and manage student requests to change their profile information.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : requests.filter(r => r.status === 'pending').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === 'pending').map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                        <div>{req.userName || req.userId}</div>
                        <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium">{req.fieldName}</TableCell>
                    <TableCell>{renderValue(req.oldValue)}</TableCell>
                    <TableCell>{renderValue(req.newValue)}</TableCell>
                    <TableCell>{format(new Date(req.requestedAt), 'PP')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(req)} className="text-green-600 hover:text-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                       <Dialog open={selectedRequest?.id === req.id && selectedRequest?.status === 'pending'} onOpenChange={(isOpen) => {
                            if (!isOpen) setSelectedRequest(null);
                            else setSelectedRequest(req);
                        }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setSelectedRequest(req)}>
                            <XCircle className="h-4 w-4 mr-1" /> Deny
                          </Button>
                        </DialogTrigger>
                        {selectedRequest && selectedRequest.id === req.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Deny Change Request</DialogTitle>
                            <DialogDescription>
                              Provide a reason for denying the request from {selectedRequest.userName} to change their {selectedRequest.fieldName}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="denialReason">Reason for Denial</Label>
                            <Textarea
                              id="denialReason"
                              value={denialReason}
                              onChange={(e) => setDenialReason(e.target.value)}
                              placeholder="e.g., Information mismatch, policy violation..."
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline" onClick={() => { setSelectedRequest(null); setDenialReason(''); }}>Cancel</Button></DialogClose>
                            <Button variant="destructive" onClick={() => handleDeny(selectedRequest)}>Confirm Denial</Button>
                          </DialogFooter>
                        </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">No pending requests.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolved Requests</CardTitle>
        </CardHeader>
        <CardContent>
           {loadingRequests ? (
             <div className="space-y-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
           ) : requests.filter(r => r.status !== 'pending').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status !== 'pending').map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                        <div>{req.userName || req.userId}</div>
                        <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium">{req.fieldName}</TableCell>
                    <TableCell>{renderValue(req.newValue)}</TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className={req.status === 'approved' ? 'bg-green-600 text-white' : ''}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{req.resolvedAt ? format(new Date(req.resolvedAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.adminNotes || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           ) : (
             <p className="text-center text-muted-foreground">No resolved requests found.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
