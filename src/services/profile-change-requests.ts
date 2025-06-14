
'use server';

import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ProfileChangeRequest } from '@/types/profile-change-request';
import type { StudentProfile } from './profile'; // To get user details for the request

/**
 * Creates a new profile change request in Firestore.
 */
export async function createProfileChangeRequest(
  userId: string,
  userName: string | undefined, // Student's name
  userEmail: string | undefined, // Student's email
  fieldName: keyof StudentProfile, // The actual key of the field being changed
  oldValue: any,
  newValue: any
): Promise<string> {
  if (!db) {
    throw new Error("Database connection is not available.");
  }
  try {
    const requestsCollection = collection(db, 'profileChangeRequests');
    const docRef = await addDoc(requestsCollection, {
      userId,
      userName: userName || 'N/A',
      userEmail: userEmail || 'N/A',
      fieldName,
      oldValue,
      newValue,
      requestedAt: serverTimestamp(),
      status: 'pending',
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating profile change request:", error);
    throw error;
  }
}

/**
 * Fetches all profile change requests from Firestore, ordered by request date.
 */
export async function getProfileChangeRequests(): Promise<ProfileChangeRequest[]> {
  if (!db) {
    throw new Error("Database connection is not available.");
  }
  try {
    const requestsCollection = collection(db, 'profileChangeRequests');
    // Order by requestedAt in descending order to show newest first
    const q = query(requestsCollection, orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date(data.requestedAt),
        resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toDate() : (data.resolvedAt ? new Date(data.resolvedAt) : undefined),
      } as ProfileChangeRequest;
    });
  } catch (error) {
    console.error("Error fetching profile change requests:", error);
    throw error;
  }
}

/**
 * Approves a profile change request, updating the user's profile and the request status.
 */
export async function approveProfileChangeRequest(
  requestId: string,
  userId: string,
  fieldName: string, // This should be a valid key for the user's document
  newValue: any,
  adminNotes?: string
): Promise<void> {
  if (!db) {
    throw new Error("Database connection is not available.");
  }
  try {
    const requestDocRef = doc(db, 'profileChangeRequests', requestId);
    const userDocRef = doc(db, 'users', userId);

    // Note: Ensure fieldName is a valid key in the 'users' document structure
    // If fieldName in StudentProfile maps differently to Firestore 'users' doc, adjust here.
    // For example, if StudentProfile.courseProgram maps to users.major.
    // For simplicity, assuming direct mapping for now.
    await updateDoc(userDocRef, { [fieldName]: newValue });

    await updateDoc(requestDocRef, {
      status: 'approved',
      resolvedAt: serverTimestamp(),
      adminNotes: adminNotes || 'Approved by admin.',
    });
  } catch (error) {
    console.error("Error approving profile change request:", error);
    throw error;
  }
}

/**
 * Denies a profile change request, updating the request status and adding admin notes.
 */
export async function denyProfileChangeRequest(requestId: string, adminNotes: string): Promise<void> {
  if (!db) {
    throw new Error("Database connection is not available.");
  }
  try {
    const requestDocRef = doc(db, 'profileChangeRequests', requestId);
    await updateDoc(requestDocRef, {
      status: 'denied',
      resolvedAt: serverTimestamp(),
      adminNotes,
    });
  } catch (error) {
    console.error("Error denying profile change request:", error);
    throw error;
  }
}
