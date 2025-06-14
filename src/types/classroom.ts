
export interface Classroom {
  id: string; // Firestore document ID
  name: string;
  subject: string;
  facultyId: string; // UID of the faculty member who owns/created it
  studentIds: string[]; // Array of student UIDs (initially can be empty)
  createdAt?: firebase.firestore.Timestamp | Date;
}

export interface ClassroomStudent { // For displaying students in a classroom
    id: string; // Student UID
    name: string;
    studentIdNumber: string; // The user-facing student ID, not UID
}
