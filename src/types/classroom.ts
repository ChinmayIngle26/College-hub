
import type { Timestamp } from 'firebase/firestore';

export interface Classroom {
  id: string; // Firestore document ID
  name: string;
  subject: string; // General subject/description of the classroom itself (e.g., "Year 1 Computer Science")
  ownerFacultyId: string; // UID of the faculty member who created and owns it
  invitedFacultyIds: string[]; // Array of UIDs of other faculty who can take attendance
  studentIds: string[]; // Array of student UIDs
  createdAt?: Timestamp | Date;
}

export interface ClassroomStudent { // For displaying students in a classroom
    id: string; // Student UID
    name: string;
    studentIdNumber: string; // The user-facing student ID, not UID
}

// Represents a faculty member for selection/display, simplified
export interface FacultyUser {
    uid: string;
    name: string;
    email: string;
}
