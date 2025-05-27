
'use server';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import type { LeaveApplication, LeaveApplicationFormData } from '@/types/leave';
import type { StudentProfile } from './profile';

const LEAVE_APPLICATIONS_COLLECTION = 'leaveApplications';
const USERS_COLLECTION = 'users';

/**
 * Adds a new leave application to Firestore.
 */
export async function addLeaveApplication(
  studentId: string,
  formData: LeaveApplicationFormData
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  if (!studentId) {
    console.error('addLeaveApplication: studentId is null or undefined.');
    throw new Error('Student ID is required to add a leave application.');
  }


  // Fetch student details (name, parentEmail)
  const userDocRef = doc(db, USERS_COLLECTION, studentId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error('Student profile not found.');
  }
  const studentData = userDocSnap.data() as StudentProfile & { parentEmail?: string };

  if (!studentData.parentEmail) {
    // This could be a scenario where parentEmail is optional or not yet set
    console.warn(`Parent's email not found in student profile for studentId: ${studentId}. Leave application will be submitted without parent notification if this field is crucial for it.`);
    // Depending on policy, you might throw an error or allow submission without parentEmail.
    // For now, we'll allow it, but the notification flow needs to handle missing parentEmail.
  }

  const newLeaveApplication: Omit<LeaveApplication, 'id'> = {
    studentId,
    studentName: studentData.name || 'N/A',
    parentEmail: studentData.parentEmail || '', // Store empty string if not found, or handle differently
    leaveType: formData.leaveType,
    startDate: Timestamp.fromDate(formData.startDate),
    endDate: Timestamp.fromDate(formData.endDate),
    reason: formData.reason,
    status: 'Pending',
    appliedAt: Timestamp.now(),
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
 */
export async function getLeaveApplicationsByStudentId(studentId: string): Promise<LeaveApplication[]> {
  if (!db) {
    console.error('getLeaveApplicationsByStudentId: Firestore DB instance is not available.');
    throw new Error('Database connection error.');
  }
  if (!studentId) {
    console.error('getLeaveApplicationsByStudentId: studentId is null or undefined.');
    throw new Error('Student ID is required to fetch leave applications.');
  }

  console.log(`getLeaveApplicationsByStudentId: Fetching applications for studentId: ${studentId}`);

  const q = query(
    collection(db, LEAVE_APPLICATIONS_COLLECTION),
    where('studentId', '==', studentId),
    orderBy('appliedAt', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    const applications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Helper to safely convert Firestore Timestamp or plain object to Timestamp
      const toTimestamp = (field: any): Timestamp => {
        if (field instanceof Timestamp) {
          return field;
        }
        if (field && typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
          return new Timestamp(field.seconds, field.nanoseconds);
        }
        // Fallback for invalid or missing date, adjust as needed
        console.warn(`Invalid timestamp data for field in doc ${doc.id}:`, field);
        return Timestamp.now(); // Or some other default/error indicator
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
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === 'permission-denied') {
        console.error(`Firebase permission denied while fetching leave applications. Ensure rules allow read for studentId: ${studentId}`);
        throw new Error(`Permission denied when fetching leave applications. Please check Firestore rules.`);
      } else if (firebaseError.code === 'failed-precondition') {
        console.error(`Firebase 'failed-precondition' error. This might be due to a missing Firestore index. Check server logs for an index creation link for collection '${LEAVE_APPLICATIONS_COLLECTION}' with query on 'studentId' and 'appliedAt'.`);
        throw new Error(`Query requires an index. Please check Firestore indexes for the '${LEAVE_APPLICATIONS_COLLECTION}' collection. The query involved 'studentId' equality and 'appliedAt' ordering.`);
      }
    }
    throw new Error(`Could not fetch leave applications. Original error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
