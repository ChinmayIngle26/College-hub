
'use server';
// Firestore imports would go here in future implementation
// import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/client'; // Or adminDb if called from secure server actions

import type { ProfileChangeRequest, ProfileChangeRequestStatus } from '@/types/profile-change-request';

const MOCK_REQUESTS: ProfileChangeRequest[] = [
  {
    id: 'req1',
    userId: 'user123',
    userName: 'Alice Wonderland',
    userEmail: 'alice@example.com',
    fieldName: 'email',
    oldValue: 'alice@example.com',
    newValue: 'alice.w@example.com',
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'pending',
  },
  {
    id: 'req2',
    userId: 'user456',
    userName: 'Bob The Builder',
    userEmail: 'bob@example.com',
    fieldName: 'contactNumber',
    oldValue: '123-456-7890',
    newValue: '987-654-3210',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'pending',
  },
  {
    id: 'req3',
    userId: 'user789',
    userName: 'Charlie Brown',
    userEmail: 'charlie@example.com',
    fieldName: 'currentAddress',
    oldValue: '123 Old Street',
    newValue: '456 New Avenue',
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'approved',
    resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    adminNotes: 'Address verified.',
  },
    {
    id: 'req4',
    userId: 'user101',
    userName: 'Diana Prince',
    userEmail: 'diana@example.com',
    fieldName: 'profilePhotoUrl',
    oldValue: 'https://placehold.co/150x150.png',
    newValue: 'https://placehold.co/150x150.png/new', // Placeholder for new URL
    requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'denied',
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    adminNotes: 'Photo did not meet guidelines.',
  },
];

/**
 * Creates a new profile change request in Firestore.
 * (Placeholder - Actual implementation in a future step)
 */
export async function createProfileChangeRequest(
  userId: string,
  fieldName: string,
  oldValue: any,
  newValue: any
): Promise<string> {
  console.log('Placeholder: createProfileChangeRequest called with:', { userId, fieldName, oldValue, newValue });
  // In a real implementation:
  // const requestsCollection = collection(db, 'profileChangeRequests');
  // const docRef = await addDoc(requestsCollection, {
  //   userId,
  //   fieldName,
  //   oldValue,
  //   newValue,
  //   requestedAt: serverTimestamp(),
  //   status: 'pending',
  // });
  // return docRef.id;
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
  return `mock_req_${Date.now()}`;
}

/**
 * Fetches all profile change requests.
 * (Placeholder - Fetches mock data for now)
 */
export async function getProfileChangeRequests(): Promise<ProfileChangeRequest[]> {
  console.log('Placeholder: getProfileChangeRequests called, returning mock data.');
  // In a real implementation:
  // const requestsCollection = collection(db, 'profileChangeRequests');
  // const snapshot = await getDocs(requestsCollection);
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileChangeRequest));
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
  return MOCK_REQUESTS;
}

/**
 * Approves a profile change request.
 * (Placeholder - Actual implementation in a future step)
 */
export async function approveProfileChangeRequest(
  requestId: string,
  userId: string,
  fieldName: string,
  newValue: any
): Promise<void> {
  console.log('Placeholder: approveProfileChangeRequest called for requestId:', requestId);
  // In a real implementation:
  // const requestDocRef = doc(db, 'profileChangeRequests', requestId);
  // const userDocRef = doc(db, 'users', userId);
  // await updateDoc(userDocRef, { [fieldName]: newValue });
  // await updateDoc(requestDocRef, { status: 'approved', resolvedAt: serverTimestamp() });
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
}

/**
 * Denies a profile change request.
 * (Placeholder - Actual implementation in a future step)
 */
export async function denyProfileChangeRequest(requestId: string, adminNotes: string): Promise<void> {
  console.log('Placeholder: denyProfileChangeRequest called for requestId:', requestId);
  // In a real implementation:
  // const requestDocRef = doc(db, 'profileChangeRequests', requestId);
  // await updateDoc(requestDocRef, { status: 'denied', adminNotes, resolvedAt: serverTimestamp() });
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
}
