
'use server';

import { db } from '@/lib/firebase/client';
import { collection, addDoc, getDocs, query, where, doc, getDoc, arrayUnion, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Classroom, ClassroomStudent } from '@/types/classroom';
import type { StudentProfile } from './profile';

/**
 * Creates a new classroom in Firestore.
 * @param name - The name of the classroom.
 * @param subject - The subject of the classroom.
 * @param facultyId - The UID of the faculty member creating the classroom.
 * @returns The ID of the newly created classroom.
 */
export async function createClassroom(name: string, subject: string, facultyId: string): Promise<string> {
  if (!db) throw new Error("Database connection is not available.");
  try {
    const classroomsCollection = collection(db, 'classrooms');
    const docRef = await addDoc(classroomsCollection, {
      name,
      subject,
      facultyId,
      studentIds: [], // Initially empty
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating classroom:", error);
    throw error;
  }
}

/**
 * Fetches all classrooms created by a specific faculty member.
 * @param facultyId - The UID of the faculty member.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassroomsByFaculty(facultyId: string): Promise<Classroom[]> {
  if (!db) throw new Error("Database connection is not available.");
  try {
    const classroomsCollection = collection(db, 'classrooms');
    const q = query(classroomsCollection, where('facultyId', '==', facultyId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Classroom));
  } catch (error) {
    console.error("Error fetching classrooms by faculty:", error);
    throw error;
  }
}

/**
 * Fetches student details for a given classroom.
 * @param classroomId - The ID of the classroom.
 * @returns A promise that resolves to an array of ClassroomStudent objects.
 */
export async function getStudentsInClassroom(classroomId: string): Promise<ClassroomStudent[]> {
  if (!db) throw new Error("Database connection is not available.");
  try {
    const classroomDocRef = doc(db, 'classrooms', classroomId);
    const classroomSnap = await getDoc(classroomDocRef);

    if (!classroomSnap.exists()) {
      console.warn(`Classroom with ID ${classroomId} not found.`);
      return [];
    }

    const classroomData = classroomSnap.data() as Classroom;
    const studentIds = classroomData.studentIds || [];

    if (studentIds.length === 0) {
      return [];
    }

    const studentPromises = studentIds.map(async (studentId) => {
      const studentDocRef = doc(db, 'users', studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as StudentProfile;
        return {
          id: studentSnap.id, // UID
          name: studentData.name || 'Unknown Student',
          studentIdNumber: studentData.studentId || 'N/A', // User-facing student ID
        };
      }
      return null;
    });

    const students = (await Promise.all(studentPromises)).filter(Boolean) as ClassroomStudent[];
    return students;

  } catch (error) {
    console.error("Error fetching students in classroom:", error);
    throw error;
  }
}

/**
 * Adds a student to a classroom's studentIds array.
 * @param classroomId - The ID of the classroom.
 * @param studentId - The UID of the student to add.
 */
export async function addStudentToClassroom(classroomId: string, studentId: string): Promise<void> {
    if (!db) throw new Error("Database connection is not available.");
    try {
        const classroomDocRef = doc(db, 'classrooms', classroomId);
        await updateDoc(classroomDocRef, {
            studentIds: arrayUnion(studentId)
        });
    } catch (error) {
        console.error("Error adding student to classroom:", error);
        throw error;
    }
}

// Placeholder for removeStudentFromClassroom if needed later
// export async function removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> { ... }

