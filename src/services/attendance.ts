
'use server';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, orderBy, doc, Timestamp } from 'firebase/firestore';
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
   * Optional: Name of the lecture or subject/topic.
   */
  lectureName?: string;
  /**
   * Optional: Name of the classroom or course.
   */
  classroomName?: string;
  /**
   * Optional: Name of the faculty who took the attendance for this record.
   */
  facultyName?: string;
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
      orderBy('date', 'desc'), 
      orderBy('submittedAt', 'desc') 
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return []; 
    }

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as LectureAttendanceRecord;
      // Ensure date is correctly formatted string
      let dateStr = data.date;
      if (data.date instanceof Timestamp) {
        dateStr = data.date.toDate().toISOString().split('T')[0];
      } else if (typeof data.date === 'object' && data.date !== null && 'seconds' in data.date && 'nanoseconds' in data.date) {
        // Handle cases where it might be a plain object from Firestore if not properly cast
        const ts = new Timestamp((data.date as any).seconds, (data.date as any).nanoseconds);
        dateStr = ts.toDate().toISOString().split('T')[0];
      }


      return {
        date: dateStr,
        status: data.status,
        lectureName: data.lectureName, // This is Subject/Topic
        classroomName: data.classroomName,
        facultyName: data.facultyName,
      };
    });
  } catch (error) {
    console.error(`Error fetching attendance records for student ${studentId}:`, error);
    throw error; 
  }
}


/**
 * Submits lecture attendance for multiple students to Firestore using a batch write.
 * @param records - An array of LectureAttendanceRecord objects to be submitted.
 *                  The facultyId and facultyName should be part of each record.
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
    if (!record.facultyId || !record.facultyName) {
        // This check ensures the faculty details are present, crucial for the new model
        console.error("Attempted to submit attendance record without facultyId or facultyName:", record);
        throw new Error("Faculty ID and Name are required for each attendance record.");
    }
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
