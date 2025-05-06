import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

/**
 * Represents a student's profile information.
 */
export interface StudentProfile {
  /**
   * The student's Firestore document ID (usually UID).
   * Or the specific student ID field if different.
   */
  studentId: string; // Can represent UID or a specific student ID field
  /**
   * The student's name.
   */
  name: string;
  /**
   * The student's major.
   */
  major: string;
  // Add other fields as needed, matching Firestore structure
  email?: string; // Optional email
  role?: string; // Optional role
}

/**
 * Asynchronously retrieves the profile information for a given student UID from Firestore.
 *
 * @param uid The Firebase Authentication User ID (UID).
 * @returns A promise that resolves to a StudentProfile object or null if not found/error.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error.
 */
export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {

  if (!db) {
    console.error("Firestore DB instance is not available.");
    throw new Error("Database connection error.");
    // return null; // Or throw an error depending on desired behavior
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Construct and return the profile object
      return {
        studentId: userData.studentId || uid, // Prefer specific ID, fallback to UID
        name: userData.name || 'N/A',
        major: userData.major || 'N/A',
        email: userData.email, // Include email if stored
        role: userData.role, // Include role if stored
        // Add other fields from userData as needed
      };
    } else {
      console.warn(`No profile document found for UID: ${uid}`);
      return null; // Return null if the document doesn't exist
    }
  } catch (error) {
    console.error("Error fetching student profile from Firestore:", error);
    // Re-throw the error or return null/handle it as appropriate
    throw error; // Re-throwing allows higher-level components to catch it
    // return null;
  }
}
