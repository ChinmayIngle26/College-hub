
// 'use server'; // REMOVED: To allow client-side calls to getLeaveApplicationsByStudentId with client auth context

// Client SDK imports for getLeaveApplicationsByStudentId
import { db as clientDb, auth as clientAuth } from '@/lib/firebase/client';
import { collection as clientCollection, query as clientQuery, where as clientWhere, getDocs as clientGetDocs, Timestamp as ClientTimestamp, orderBy as clientOrderBy, doc as clientDoc, getDoc as clientGetDoc } from 'firebase/firestore';

// Admin SDK imports for addLeaveApplication
import { adminDb, adminInitializationError } from '@/lib/firebase/admin';
import { Timestamp as AdminTimestamp, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

import type { LeaveApplication, LeaveApplicationFormData } from '@/types/leave';
import type { StudentProfile } from './profile';

const LEAVE_APPLICATIONS_COLLECTION = 'leaveApplications';
const USERS_COLLECTION = 'users';

/**
 * Adds a new leave application to Firestore using the Admin SDK.
 * This function is typically called from a Server Action.
 */
export async function addLeaveApplication(
  studentId: string,
  formData: LeaveApplicationFormData
): Promise<string> {
  console.log(`[Service:addLeaveApplication] Called for studentId: '${studentId}' with formData:`, formData);

  if (adminInitializationError) {
    console.error('[Service:addLeaveApplication] Firebase Admin SDK failed to initialize. Cannot proceed.', adminInitializationError);
    throw new Error(`Firebase Admin SDK failed to initialize. Details: ${adminInitializationError.message}`);
  }
  if (!adminDb) {
    console.error('[Service:addLeaveApplication] Firebase Admin DB is not initialized.');
    throw new Error('Firebase Admin DB is not initialized for addLeaveApplication.');
  }
  if (!studentId) {
    console.error('[Service:addLeaveApplication] studentId is null or undefined.');
    throw new Error('Student ID is required to add a leave application.');
  }

  let studentData: (StudentProfile & { parentEmail?: string; name?: string }) | null = null;
  try {
    console.log(`[Service:addLeaveApplication] Attempting to fetch user profile (Admin SDK) for studentId: '${studentId}'...`);
    const userDocRef = adminDb.collection(USERS_COLLECTION).doc(studentId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.error(`[Service:addLeaveApplication] Student profile not found for studentId: ${studentId}.`);
      throw new Error(`Student profile not found for studentId: ${studentId}.`);
    }
    const fetchedData = userDocSnap.data();
    studentData = fetchedData as StudentProfile & { parentEmail?: string; name?: string }; // Type assertion
    console.log(`[Service:addLeaveApplication] Successfully fetched student profile (Admin SDK):`, studentData);

    if (!studentData.parentEmail) {
      console.warn(`[Service:addLeaveApplication] Parent's email not found in student profile for studentId: ${studentId}. Application will proceed.`);
    }
  } catch (profileError) {
    console.error(`[Service:addLeaveApplication] Error fetching student profile (Admin SDK) for studentId ${studentId}:`, profileError);
    throw new Error(`Could not fetch student profile (Admin SDK). Original error: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
  }

  const newLeaveApplication = {
    studentId,
    studentName: studentData.name || 'N/A',
    parentEmail: studentData.parentEmail || '',
    leaveType: formData.leaveType,
    startDate: AdminTimestamp.fromDate(formData.startDate),
    endDate: AdminTimestamp.fromDate(formData.endDate),
    reason: formData.reason,
    status: 'Pending',
    appliedAt: AdminFieldValue.serverTimestamp(),
  };

  try {
    console.log(`[Service:addLeaveApplication] Attempting to add new leave application document (Admin SDK):`, newLeaveApplication);
    const docRef = await adminDb.collection(LEAVE_APPLICATIONS_COLLECTION).add(newLeaveApplication);
    console.log(`[Service:addLeaveApplication] Successfully added application ${docRef.id} (Admin SDK) for studentId: ${studentId}`);
    return docRef.id;
  } catch (error) {
    console.error(`[Service:addLeaveApplication] Error adding leave application (Admin SDK) for studentId ${studentId}:`, error);
    throw new Error(`Could not submit leave application (Admin SDK). Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves all leave applications for a specific student using the Client SDK.
 * This function can be called from client-side components.
 */
export async function getLeaveApplicationsByStudentId(studentId: string): Promise<LeaveApplication[]> {
  console.log(`[Service:getLeaveApplicationsByStudentId] Called for studentId: '${studentId}'`);

  if (!clientDb || !clientAuth) { 
    console.error('[Service:getLeaveApplicationsByStudentId] Firestore Client DB or Auth instance is not available.');
    throw new Error('Database or Auth connection error. Ensure Firebase is initialized on the client.');
  }
  if (!studentId) {
    console.error('[Service:getLeaveApplicationsByStudentId] studentId is null, undefined, or empty.');
    throw new Error('Student ID is required to fetch leave applications.');
  }

  const currentUser = clientAuth.currentUser;
  if (currentUser) {
    console.log(`[Service:getLeaveApplicationsByStudentId] Current Firebase Auth user on client: ${currentUser.uid} (Email: ${currentUser.email})`);
    if (currentUser.uid !== studentId) {
        console.warn(`[Service:getLeaveApplicationsByStudentId] WARNING - Querying for studentId '${studentId}' but current auth user is '${currentUser.uid}'. This might lead to permission issues if rules expect these to match.`);
    }
  } else {
    console.warn(`[Service:getLeaveApplicationsByStudentId] No current Firebase Auth user found on client. This will likely cause permission denied if rules require authentication.`);
  }

  const q = clientQuery(
    clientCollection(clientDb, LEAVE_APPLICATIONS_COLLECTION),
    clientWhere('studentId', '==', studentId),
    clientOrderBy('appliedAt', 'desc')
  );

  try {
    const querySnapshot = await clientGetDocs(q);
    const applications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const toTimestamp = (field: any): ClientTimestamp => {
        if (field instanceof ClientTimestamp) return field;
        if (field && typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
          return new ClientTimestamp(field.seconds, field.nanoseconds);
        }
        console.warn(`[Service:getLeaveApplicationsByStudentId] Invalid timestamp data for field in doc ${doc.id}:`, field);
        return ClientTimestamp.now(); 
      };
      return {
        id: doc.id,
        ...data,
        startDate: toTimestamp(data.startDate),
        endDate: toTimestamp(data.endDate),
        appliedAt: toTimestamp(data.appliedAt),
      } as LeaveApplication;
    });
    console.log(`[Service:getLeaveApplicationsByStudentId] Found ${applications.length} applications for studentId: ${studentId}`);
    return applications;
  } catch (error) {
    console.error(`[Service:getLeaveApplicationsByStudentId] Error fetching leave applications for studentId ${studentId}:`, error);
    const firebaseError = error as { code?: string; message: string };
    if (firebaseError.code === 'permission-denied') {
      console.error(`[Service:getLeaveApplicationsByStudentId] Firebase permission denied for studentId: ${studentId}. Rules evaluated with auth:`, clientAuth?.currentUser?.uid);
      throw new Error(`Permission denied when fetching leave applications. Please check Firestore rules AND ensure the composite index (studentId ASC, appliedAt DESC) exists for the '${LEAVE_APPLICATIONS_COLLECTION}' collection.`);
    } else if (firebaseError.code === 'failed-precondition') {
      console.error(`[Service:getLeaveApplicationsByStudentId] Firebase 'failed-precondition' for studentId: ${studentId}. This usually means a required Firestore index is missing.`);
      throw new Error(`Query requires an index. Please create a composite index on '${LEAVE_APPLICATIONS_COLLECTION}' for 'studentId' (Ascending) and 'appliedAt' (Descending).`);
    }
    throw new Error(`Could not fetch leave applications. Original error: ${firebaseError.message}`);
  }
}
