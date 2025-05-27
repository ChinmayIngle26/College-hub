
import type { Timestamp } from 'firebase/firestore';

export type LeaveType = 'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveApplication {
  id?: string; // Firestore document ID
  studentId: string;
  studentName: string; // Denormalized for easier display
  parentEmail: string; // To send notification
  leaveType: LeaveType;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
  status: LeaveStatus;
  appliedAt: Timestamp;
}

export interface LeaveApplicationFormData {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}
