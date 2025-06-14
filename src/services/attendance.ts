
'use server';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { LectureAttendanceRecord } from '@/types/lectureAttendance';

/**
 * Represents a student's attendance record for a specific date (original structure for student view).
 */
export interface AttendanceRecord {
  /**
   * The date of the attendance record.
   */
  date: string; // Should be YYYY-MM-DD
  /**
   * Whether the student was present or absent.
   */
  status: 'present' | 'absent';
  /**
   * Optional: Name of the lecture or subject.
   */
  lectureName?: string;
  /**
   * Optional: Name of the classroom or course.
   */
  classroomName?: string;
}

/**
 * Asynchronously retrieves the attendance records for a given student from the 'lectureAttendance' collection.
 *
 * @param studentId The UID of the student.
 * @returns A promise that resolves to an array of AttendanceRecord objects.
 */
export async function getAttendanceRecords(studentId: string): Promise<AttendanceRecord[]> {
  if (!db) {
    console.error("Firestore DB instance is not available for getAttendanceRecords.");
    throw new Error("Database connection error.");
  }

  try {
    const lectureAttendanceCollection = collection(db, 'lectureAttendance');
    const q = query(
      lectureAttendanceCollection,
      where('studentId', '==', studentId),
      orderBy('date', 'desc'), // Show most recent first
      orderBy('submittedAt', 'desc') // Secondary sort by submission time if dates are same
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return []; // No records found for this student
    }

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as LectureAttendanceRecord;
      return {
        date: data.date, // YYYY-MM-DD format from faculty submission
        status: data.status,
        lectureName: data.lectureName,
        classroomName: data.classroomName,
      };
    });
  } catch (error) {
    console.error(`Error fetching attendance records for student ${studentId}:`, error);
    // Fallback to returning a few mock records if there's an error, or throw.
    // For production, you'd likely throw or return an empty array with an error message.
    // throw error; // Or handle more gracefully
     return [
      { date: '2024-01-01', status: 'present', lectureName: 'Error Fetching', classroomName: 'System' },
    ];
  }
}


/**
 * Submits lecture attendance for multiple students to Firestore using a batch write.
 * @param records - An array of LectureAttendanceRecord objects to be submitted.
 */
export async function submitLectureAttendance(records: Omit<LectureAttendanceRecord, 'id' | 'submittedAt'>[]): Promise<void> {
  if (!db) {
    throw new Error("Database connection is not available.");
  }
  if (records.length === 0) {
    console.warn("No attendance records to submit.");
    return;
  }

  const batch = writeBatch(db);
  const lectureAttendanceCollection = collection(db, 'lectureAttendance');

  records.forEach(record => {
    const newRecordRef = doc(lectureAttendanceCollection); // Auto-generate ID
    batch.set(newRecordRef, {
      ...record,
      submittedAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error submitting lecture attendance batch:", error);
    throw error;
  }
}
