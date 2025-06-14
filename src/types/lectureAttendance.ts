
export interface LectureAttendanceRecord {
  id?: string; // Firestore document ID, optional for creation
  classroomId: string;
  classroomName: string; // Denormalized for easier querying/display
  facultyId: string; // UID of faculty who submitted
  date: string; // YYYY-MM-DD
  lectureName: string;
  studentId: string; // UID of the student
  studentName: string; // Denormalized for easier querying/display
  status: 'present' | 'absent';
  submittedAt?: firebase.firestore.Timestamp | Date;
}
