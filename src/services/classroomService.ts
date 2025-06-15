
'use server';

import { db } from '@/lib/firebase/client';
import { 
    collection, addDoc, getDocs, query, where, doc, getDoc, 
    arrayUnion, updateDoc, serverTimestamp, orderBy, Timestamp 
} from 'firebase/firestore';
import type { Classroom, ClassroomStudent, FacultyUser } from '@/types/classroom';
import type { StudentProfile } from './profile';

/**
 * Creates a new classroom in Firestore.
 * @param name - The name of the classroom.
 * @param subject - The general subject/description of the classroom.
 * @param ownerFacultyId - The UID of the faculty member creating and owning the classroom.
 * @returns The ID of the newly created classroom.
 */
export async function createClassroom(name: string, subject: string, ownerFacultyId: string): Promise<string> {
  if (!db) throw new Error("Database connection is not available.");
  if (!ownerFacultyId) throw new Error("Owner faculty ID is required.");
  try {
    const classroomsCollection = collection(db, 'classrooms');
    const docRef = await addDoc(classroomsCollection, {
      name,
      subject,
      ownerFacultyId,
      invitedFacultyIds: [], // Initialize with no invited faculty
      studentIds: [], 
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating classroom:", error);
    throw error;
  }
}

/**
 * Fetches classrooms where the given facultyId is either the owner or an invited faculty.
 * @param facultyId - The UID of the faculty member.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassroomsByFaculty(facultyId: string): Promise<Classroom[]> {
  if (!db) throw new Error("Database connection is not available.");
  if (!facultyId) return [];

  try {
    const classroomsCollection = collection(db, 'classrooms');
    
    // Query for classrooms owned by the faculty
    const ownedQuery = query(classroomsCollection, where('ownerFacultyId', '==', facultyId));
    
    // Query for classrooms where the faculty is an invited member
    const invitedQuery = query(classroomsCollection, where('invitedFacultyIds', 'array-contains', facultyId));

    const [ownedSnapshot, invitedSnapshot] = await Promise.all([
      getDocs(ownedQuery),
      getDocs(invitedQuery)
    ]);

    const classroomsMap = new Map<string, Classroom>();

    ownedSnapshot.docs.forEach(docSnap => {
      if (!classroomsMap.has(docSnap.id)) {
        classroomsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as Classroom);
      }
    });

    invitedSnapshot.docs.forEach(docSnap => {
      if (!classroomsMap.has(docSnap.id)) {
        classroomsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as Classroom);
      }
    });
    
    // Sort by creation date, most recent first
    const sortedClassrooms = Array.from(classroomsMap.values()).sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
    });

    return sortedClassrooms;

  } catch (error) {
    console.error("Error fetching classrooms by faculty:", error);
    throw error;
  }
}


/**
 * Adds an invited faculty member (by UID) to a classroom's invitedFacultyIds array.
 * Only the classroom owner can perform this action.
 * @param classroomId - The ID of the classroom.
 * @param ownerFacultyId - The UID of the faculty performing the invite (must be owner).
 * @param invitedFacultyId - The UID of the faculty to invite.
 */
export async function addInvitedFacultyToClassroom(classroomId: string, ownerFacultyId: string, invitedFacultyId: string): Promise<void> {
    if (!db) throw new Error("Database connection is not available.");
    if (!classroomId || !ownerFacultyId || !invitedFacultyId) throw new Error("Missing required parameters.");

    try {
        const classroomDocRef = doc(db, 'classrooms', classroomId);
        const classroomSnap = await getDoc(classroomDocRef);

        if (!classroomSnap.exists()) {
            throw new Error(`Classroom with ID ${classroomId} not found.`);
        }

        const classroomData = classroomSnap.data() as Classroom;
        if (classroomData.ownerFacultyId !== ownerFacultyId) {
            throw new Error("Only the classroom owner can invite other faculty.");
        }
        
        if (ownerFacultyId === invitedFacultyId) {
            throw new Error("Owner cannot invite themselves.");
        }
        if (classroomData.invitedFacultyIds?.includes(invitedFacultyId)) {
            // Already invited, maybe just return success or a specific message
            console.log(`Faculty ${invitedFacultyId} is already invited to classroom ${classroomId}.`);
            return;
        }

        await updateDoc(classroomDocRef, {
            invitedFacultyIds: arrayUnion(invitedFacultyId)
        });
    } catch (error) {
        console.error("Error adding invited faculty to classroom:", error);
        throw error;
    }
}

/**
 * Fetches all faculty users (UID, name, email) for display in an "invite" list.
 * In a real app, this might have pagination or search.
 * This is a simplified version.
 * @returns A promise that resolves to an array of FacultyUser objects.
 */
export async function getAllFacultyUsers(): Promise<FacultyUser[]> {
    if (!db) throw new Error("Database connection is not available.");
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'faculty'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                uid: docSnap.id,
                name: data.name || 'Unknown Faculty',
                email: data.email || 'No email'
            } as FacultyUser;
        });
    } catch (error) {
        console.error("Error fetching all faculty users:", error);
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
      const studentDocRef = doc(db, 'users', studentId); // Assuming student UIDs are stored
      const studentSnap = await getDoc(studentDocRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as StudentProfile; // Using StudentProfile for structure
        return {
          id: studentSnap.id, // This is the student's UID
          name: studentData.name || 'Unknown Student',
          studentIdNumber: studentData.studentId || 'N/A', // User-facing student ID (from profile)
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
 * Adds a student (by UID) to a classroom's studentIds array.
 * @param classroomId - The ID of the classroom.
 * @param studentUserId - The UID of the student to add.
 */
export async function addStudentToClassroom(classroomId: string, studentUserId: string): Promise<void> {
    if (!db) throw new Error("Database connection is not available.");
    try {
        const classroomDocRef = doc(db, 'classrooms', classroomId);
        await updateDoc(classroomDocRef, {
            studentIds: arrayUnion(studentUserId)
        });
    } catch (error) {
        console.error("Error adding student to classroom:", error);
        throw error;
    }
}
