
// import type { Timestamp } from 'firebase/firestore';

// export interface Classroom {
//   id: string; // Firestore document ID
//   name: string;
//   subject: string; // General subject/description of the classroom itself (e.g., "Year 1 Computer Science")
//   ownerFacultyId: string; // UID of the faculty member who created and owns it
//   invitedFacultyIds: string[]; // Array of UIDs of other faculty who can take attendance
//   studentIds: string[]; // Array of student UIDs
//   createdAt?: Timestamp | Date;
// }

// export interface ClassroomStudent { // For displaying students in a classroom
//     id: string; // Student UID
//     name: string;
//     studentIdNumber: string; // The user-facing student ID, not UID
// }

// // Represents a faculty member for selection/display, simplified
// export interface FacultyUser {
//     uid: string;
//     name: string;
//     email: string;
// }



import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a classroom created by a faculty member.
 */
export interface Classroom {
  id: string; // Firestore document ID (set manually after fetching the doc)
  
  name: string; // Name of the classroom (e.g., "AIML Year 1")
  
  subject: string; // Subject or short description of the classroom (e.g., "Data Structures")
  
  ownerFacultyId: string; // UID of the faculty member who created the classroom (must match request.auth.uid in Firestore rules)
  
  invitedFacultyIds: string[]; // UIDs of other faculty members allowed to access and manage this classroom
  
  studentIds: string[]; // UIDs of students enrolled in this classroom

  createdAt?: Timestamp | Date; // Optional timestamp, set on creation (server timestamp or JS Date)
}

/**
 * Represents a student in a classroom, for UI display purposes.
 */
export interface ClassroomStudent {
  id: string; // UID of the student

  name: string; // Full name of the student

  studentIdNumber: string; // Official student ID (e.g., "002"), shown in listings
}

/**
 * Simplified representation of a faculty member, used in selection components.
 */
export interface FacultyUser {
  uid: string; // Firebase UID of the faculty user

  name: string; // Name of the faculty member

  email: string; // Email of the faculty member (used for display or contact)
}

