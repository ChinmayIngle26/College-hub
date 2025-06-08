
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
  console.log(`[Service:addLeaveApplication] Called for studentId: '${studentId}' with formData:`, formData);

  if (!db) {
    console.error('[Service:addLeaveApplication] Firestore is not initialized.');
    throw new Error('Firestore is not initialized for addLeaveApplication.');
  }
  if (!studentId) {
    console.error('[Service:addLeaveApplication] studentId is null or undefined.');
    throw new Error('Student ID is required to add a leave application.');
  }

  let studentData: (StudentProfile & { parentEmail?: string; name?: string }) | null = null;
  try {
    console.log(`[Service:addLeaveApplication] Attempting to fetch user profile for studentId: '${studentId}'...`);
    const userDocRef = doc(db, USERS_COLLECTION, studentId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error(`[Service:addLeaveApplication] Student profile not found for studentId: ${studentId}.`);
      throw new Error(`Student profile not found for studentId: ${studentId}.`);
    }
    studentData = userDocSnap.data() as StudentProfile & { parentEmail?: string; name?: string };
    console.log(`[Service:addLeaveApplication] Successfully fetched student profile:`, studentData);

    if (!studentData.parentEmail) {
      console.warn(`[Service:addLeaveApplication] Parent's email not found in student profile for studentId: ${studentId}. Application will proceed.`);
    }
  } catch (profileError) {
    console.error(`[Service:addLeaveApplication] Error fetching student profile for studentId ${studentId}:`, profileError);
    if (profileError instanceof Error && 'code' in profileError) {
        const firebaseError = profileError as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            console.error(`[Service:addLeaveApplication] Firebase permission denied while fetching student profile for studentId: ${studentId}.`);
            throw new Error(`Permission denied when fetching student profile. Please check Firestore rules for 'users' collection.`);
        }
    }
    throw new Error(`Could not fetch student profile. Original error: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
  }


  const newLeaveApplication: Omit<LeaveApplication, 'id' | 'appliedAt'> & { appliedAt: any } = { // Allow 'any' for serverTimestamp before write
    studentId,
    studentName: studentData.name || 'N/A',
    parentEmail: studentData.parentEmail || '', // Use fetched parentEmail or default
    leaveType: formData.leaveType,
    startDate: Timestamp.fromDate(formData.startDate),
    endDate: Timestamp.fromDate(formData.endDate),
    reason: formData.reason,
    status: 'Pending', // Default status
    appliedAt: serverTimestamp(), // Use Firestore server-side timestamp
  };

  try {
    console.log(`[Service:addLeaveApplication] Attempting to add new leave application document:`, newLeaveApplication);
    const docRef = await addDoc(collection(db, LEAVE_APPLICATIONS_COLLECTION), newLeaveApplication);
    console.log(`[Service:addLeaveApplication] Successfully added application ${docRef.id} for studentId: ${studentId}`);
    return docRef.id;
  } catch (error) {
    console.error(`[Service:addLeaveApplication] Error adding leave application for studentId ${studentId}:`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            console.error(`[Service:addLeaveApplication] Firebase permission denied while adding leave application document for studentId: ${studentId}. Rules evaluated with auth:`, auth?.currentUser?.uid);
            throw new Error(`Permission denied when submitting leave application. Please check Firestore rules for 'leaveApplications' collection.`);
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
  console.log(`[Service:getLeaveApplicationsByStudentId] Called for studentId: '${studentId}'`);

  if (!db || !auth) { // Check auth as well
    console.error('[Service:getLeaveApplicationsByStudentId] Firestore DB or Auth instance is not available.');
    throw new Error('Database or Auth connection error. Ensure Firebase is initialized on the client.');
  }
  if (!studentId) {
    console.error('[Service:getLeaveApplicationsByStudentId] studentId is null, undefined, or empty.');
    throw new Error('Student ID is required to fetch leave applications.');
  }

  // Log current user from client-side auth, if available (for debugging)
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log(`[Service:getLeaveApplicationsByStudentId] Current Firebase Auth user on client: ${currentUser.uid} (Email: ${currentUser.email})`);
    if (currentUser.uid !== studentId) {
        console.warn(`[Service:getLeaveApplicationsByStudentId] WARNING - Querying for studentId '${studentId}' but current auth user is '${currentUser.uid}'. This might lead to permission issues if rules expect these to match.`);
    }
  } else {
    console.warn(`[Service:getLeaveApplicationsByStudentId] No current Firebase Auth user found on client. This will likely cause permission denied if rules require authentication.`);
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
        console.warn(`[Service:getLeaveApplicationsByStudentId] Invalid timestamp data for field in doc ${doc.id}:`, field);
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
    console.log(`[Service:getLeaveApplicationsByStudentId] Found ${applications.length} applications for studentId: ${studentId}`);
    return applications;
  } catch (error) {
    console.error(`[Service:getLeaveApplicationsByStudentId] Error fetching leave applications for studentId ${studentId}:`, error);
    const firebaseError = error as { code?: string; message: string };
    if (firebaseError.code === 'permission-denied') {
      console.error(`[Service:getLeaveApplicationsByStudentId] Firebase permission denied for studentId: ${studentId}. This often means rules are too restrictive OR a required Firestore index is missing for the query (collection: '${LEAVE_APPLICATIONS_COLLECTION}', where 'studentId' == '${studentId}', orderBy 'appliedAt' desc). Rules evaluated with auth:`, auth?.currentUser?.uid);
      throw new Error(`Permission denied when fetching leave applications. Please check Firestore rules AND ensure the composite index (studentId ASC, appliedAt DESC) exists for the '${LEAVE_APPLICATIONS_COLLECTION}' collection.`);
    } else if (firebaseError.code === 'failed-precondition') {
      console.error(`[Service:getLeaveApplicationsByStudentId] Firebase 'failed-precondition' for studentId: ${studentId}. This usually means a required Firestore index is missing. Please create a composite index on '${LEAVE_APPLICATIONS_COLLECTION}' for 'studentId' (Ascending) and 'appliedAt' (Descending).`);
      throw new Error(`Query requires an index. Please create a composite index on '${LEAVE_APPLICATIONS_COLLECTION}' for 'studentId' (Ascending) and 'appliedAt' (Descending).`);
    }
    throw new Error(`Could not fetch leave applications. Original error: ${firebaseError.message}`);
  }
}
