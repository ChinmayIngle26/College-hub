
// 'use server'; // REMOVED: To allow client-side calls to getLeaveApplicationsByStudentId with client auth context
import { db, auth } from '@/lib/firebase/client'; // Ensure auth is imported
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { LeaveApplication, LeaveApplicationFormData } from '@/types/leave';
import type { StudentProfile } from './profile';

const LEAVE_APPLICATIONS_COLLECTION = 'leaveApplications';
const USERS_COLLECTION = 'users';

/**
 * Adds a new leave application to Firestore.
 * This function is typically called from a Server Action.
 */
export async function addLeaveApplication(
  studentId: string,
  formData: LeaveApplicationFormData
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized for addLeaveApplication.');
  }
  if (!studentId) {
    console.error('addLeaveApplication: studentId is null or undefined.');
    throw new Error('Student ID is required to add a leave application.');
  }

  const userDocRef = doc(db, USERS_COLLECTION, studentId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error(`Student profile not found for studentId: ${studentId}.`);
  }
  const studentData = userDocSnap.data() as StudentProfile & { parentEmail?: string };

  if (!studentData.parentEmail) {
    console.warn(`Parent's email not found in student profile for studentId: ${studentId}. Application will proceed.`);
  }

  const newLeaveApplication: Omit<LeaveApplication, 'id' | 'appliedAt'> & { appliedAt: any } = { // Allow 'any' for serverTimestamp before write
    studentId,
    studentName: studentData.name || 'N/A',
    parentEmail: studentData.parentEmail || '',
    leaveType: formData.leaveType,
    startDate: Timestamp.fromDate(formData.startDate),
    endDate: Timestamp.fromDate(formData.endDate),
    reason: formData.reason,
    status: 'Pending',
    appliedAt: serverTimestamp(), // Use Firestore server-side timestamp
  };

  try {
    const docRef = await addDoc(collection(db, LEAVE_APPLICATIONS_COLLECTION), newLeaveApplication);
    console.log(`addLeaveApplication: Successfully added application ${docRef.id} for studentId: ${studentId}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding leave application for studentId ${studentId}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            console.error(`Firebase permission denied while adding leave application for studentId: ${studentId}`);
            throw new Error(`Permission denied when submitting leave application. Please check Firestore rules.`);
        }
    }
    throw new Error(`Could not submit leave application. Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves all leave applications for a specific student.
 * This function can be called from client-side components.
 */
export async function getLeaveApplicationsByStudentId(studentId: string): Promise<LeaveApplication[]> {
  console.log(`getLeaveApplicationsByStudentId: Called for studentId: '${studentId}'`);

  if (!db || !auth) { // Check auth as well
    console.error('getLeaveApplicationsByStudentId: Firestore DB or Auth instance is not available.');
    throw new Error('Database or Auth connection error. Ensure Firebase is initialized on the client.');
  }
  if (!studentId) {
    console.error('getLeaveApplicationsByStudentId: studentId is null, undefined, or empty.');
    throw new Error('Student ID is required to fetch leave applications.');
  }

  // Log current user from client-side auth, if available (for debugging)
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log(`getLeaveApplicationsByStudentId: Current Firebase Auth user on client: ${currentUser.uid} (Email: ${currentUser.email})`);
    if (currentUser.uid !== studentId) {
        console.warn(`getLeaveApplicationsByStudentId: WARNING - Querying for studentId '${studentId}' but current auth user is '${currentUser.uid}'. This might lead to permission issues if rules expect these to match.`);
    }
  } else {
    console.warn(`getLeaveApplicationsByStudentId: No current Firebase Auth user found on client. This will likely cause permission denied if rules require authentication.`);
  }

  const q = query(
    collection(db, LEAVE_APPLICATIONS_COLLECTION),
    where('studentId', '==', studentId),
    orderBy('appliedAt', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    const applications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const toTimestamp = (field: any): Timestamp => {
        if (field instanceof Timestamp) return field;
        if (field && typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
          return new Timestamp(field.seconds, field.nanoseconds);
        }
        console.warn(`Invalid timestamp data for field in doc ${doc.id}:`, field);
        return Timestamp.now(); // Fallback, should ideally not happen with serverTimestamp
      };
      return {
        id: doc.id,
        ...data,
        startDate: toTimestamp(data.startDate),
        endDate: toTimestamp(data.endDate),
        appliedAt: toTimestamp(data.appliedAt),
      } as LeaveApplication;
    });
    console.log(`getLeaveApplicationsByStudentId: Found ${applications.length} applications for studentId: ${studentId}`);
    return applications;
  } catch (error) {
    console.error(`Error fetching leave applications for studentId ${studentId}:`, error);
    const firebaseError = error as { code?: string; message: string };
    if (firebaseError.code === 'permission-denied') {
      console.error(`Firebase permission denied for studentId: ${studentId}. This often means rules are too restrictive OR a required Firestore index is missing for the query (collection: '${LEAVE_APPLICATIONS_COLLECTION}', where 'studentId' == '${studentId}', orderBy 'appliedAt' desc).`);
      throw new Error(`Permission denied when fetching leave applications. Please check Firestore rules AND ensure the composite index (studentId ASC, appliedAt DESC) exists for the '${LEAVE_APPLICATIONS_COLLECTION}' collection.`);
    } else if (firebaseError.code === 'failed-precondition') {
      console.error(`Firebase 'failed-precondition' for studentId: ${studentId}. This usually means a required Firestore index is missing. Please create a composite index on '${LEAVE_APPLICATIONS_COLLECTION}' for 'studentId' (Ascending) and 'appliedAt' (Descending).`);
      throw new Error(`Query requires an index. Please create a composite index on '${LEAVE_APPLICATIONS_COLLECTION}' for 'studentId' (Ascending) and 'appliedAt' (Descending).`);
    }
    throw new Error(`Could not fetch leave applications. Original error: ${firebaseError.message}`);
  }
}
