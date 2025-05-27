
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

  // Fetch student details (name, parentEmail)
  const userDocRef = doc(db, USERS_COLLECTION, studentId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error('Student profile not found.');
  }
  const studentData = userDocSnap.data() as StudentProfile & { parentEmail?: string };

  if (!studentData.parentEmail) {
    throw new Error("Parent's email not found in student profile.");
  }

  const newLeaveApplication: Omit<LeaveApplication, 'id'> = {
    studentId,
    studentName: studentData.name || 'N/A',
    parentEmail: studentData.parentEmail,
    leaveType: formData.leaveType,
    startDate: Timestamp.fromDate(formData.startDate),
    endDate: Timestamp.fromDate(formData.endDate),
    reason: formData.reason,
    status: 'Pending',
    appliedAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, LEAVE_APPLICATIONS_COLLECTION), newLeaveApplication);
    return docRef.id;
  } catch (error) {
    console.error('Error adding leave application:', error);
    throw new Error('Could not submit leave application.');
  }
}

/**
 * Retrieves all leave applications for a specific student.
 */
export async function getLeaveApplicationsByStudentId(studentId: string): Promise<LeaveApplication[]> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const q = query(
    collection(db, LEAVE_APPLICATIONS_COLLECTION),
    where('studentId', '==', studentId),
    orderBy('appliedAt', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveApplication));
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    throw new Error('Could not fetch leave applications.');
  }
}
