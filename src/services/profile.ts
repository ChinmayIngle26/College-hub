/**
 * Represents a student's profile information.
 */
export interface StudentProfile {
  /**
   * The student's ID.
   */
  studentId: string;
  /**
   * The student's name.
   */
  name: string;
  /**
   * The student's major.
   */
  major: string;
}

/**
 * Asynchronously retrieves the profile information for a given student.
 *
 * @param studentId The ID of the student.
 * @returns A promise that resolves to a StudentProfile object.
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
  // TODO: Implement this by calling an API.

  return {
    studentId: '12345',
    name: 'John Doe',
    major: 'Computer Science',
  };
}
