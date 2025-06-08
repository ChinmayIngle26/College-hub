
'use server';

import * as z from 'zod';
import { addLeaveApplication } from '@/services/leaveApplications';
import { sendLeaveNotification } from '@/ai/flows/send-leave-notification-flow';
import type { LeaveApplicationFormData } from '@/types/leave';
import { cookies } from 'next/headers';

// Admin SDK imports for getStudentDetailsForNotification (now from admin.server.ts)
import { adminDb, adminInitializationError } from '@/lib/firebase/admin.server'; // UPDATED IMPORT

const leaveApplicationSchema = z.object({
  leaveType: z.enum(['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other']),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters long.' }).max(500),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


export interface SubmitLeaveApplicationState {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
  applicationId?: string;
}

export async function submitLeaveApplicationAction(
  studentId: string,
  prevState: SubmitLeaveApplicationState | null,
  formData: FormData
): Promise<SubmitLeaveApplicationState> {

  if (!studentId) {
    return { success: false, message: "User not authenticated or studentId missing." };
  }

  const rawFormData = {
    leaveType: formData.get('leaveType'),
    startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
    endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    reason: formData.get('reason'),
  };

  const validationResult = leaveApplicationSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: validationResult.error.issues,
    };
  }

  const validatedData = validationResult.data as LeaveApplicationFormData;

  try {
    // addLeaveApplication now uses Admin SDK from admin.server.ts
    const applicationId = await addLeaveApplication(studentId, validatedData);

    // getStudentDetailsForNotification now uses Admin SDK from admin.server.ts
    const { studentName, parentEmail } = await getStudentDetailsForNotification(studentId);

    if (!parentEmail || !studentName) {
        console.warn(`Parent email or student name not found for student ${studentId} for notification. Application submitted, but notification might fail or be incomplete.`);
    }

    if (parentEmail && studentName) {
        sendLeaveNotification({
            parentEmail: parentEmail,
            studentName: studentName,
            leaveType: validatedData.leaveType,
            startDate: validatedData.startDate.toISOString().split('T')[0],
            endDate: validatedData.endDate.toISOString().split('T')[0],
            reason: validatedData.reason,
        }).then(notificationResult => {
            if (!notificationResult.success) {
                console.warn("Leave application submitted, but notification sending failed:", notificationResult.message);
            } else {
                console.log("Leave notification sent successfully for application:", applicationId);
            }
        }).catch(notificationError => {
            console.error("Error triggering leave notification flow for application " + applicationId + ":", notificationError);
        });
    } else {
        console.log("Skipping notification for application " + applicationId + " due to missing parentEmail or studentName.");
    }

    return {
      success: true,
      message: "Leave application submitted successfully! A notification has been sent to your parent (if details were available).",
      applicationId,
    };
  } catch (error) {
    console.error("Error submitting leave application in action:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred during leave submission.",
    };
  }
}

// Helper to get student details needed for notification using Admin SDK from admin.server.ts
async function getStudentDetailsForNotification(studentId: string): Promise<{ studentName: string | null; parentEmail: string | null }> {
    console.log(`[Action:getStudentDetails] Attempting to fetch details for studentId: '${studentId}' using Admin SDK (admin.server.ts).`);
    if (adminInitializationError) {
        console.error('[Action:getStudentDetails] Firebase Admin SDK (admin.server.ts) failed to initialize. Cannot fetch student details.', adminInitializationError);
        return { studentName: null, parentEmail: null };
    }
    if (!adminDb) {
        console.error('[Action:getStudentDetails] Firebase Admin DB (from admin.server.ts) is not initialized. Cannot fetch student details for notification.');
        return { studentName: null, parentEmail: null };
    }

    try {
        const userAdminDocRef = adminDb.collection("users").doc(studentId);
        const userDocSnap = await userAdminDocRef.get();
        if (userDocSnap.exists) {
            const data = userDocSnap.data()!;
            console.log(`[Action:getStudentDetails] Successfully fetched details for studentId '${studentId}' (Admin SDK from admin.server.ts): Name: ${data.name}, ParentEmail: ${data.parentEmail}`);
            return { studentName: data.name || null, parentEmail: data.parentEmail || null };
        } else {
            console.warn(`[Action:getStudentDetails] User document not found for studentId '${studentId}' via Admin SDK (admin.server.ts).`);
            return { studentName: null, parentEmail: null };
        }
    } catch (error) {
        console.error(`[Action:getStudentDetails] Error fetching user details for studentId '${studentId}' via Admin SDK (admin.server.ts):`, error);
        return { studentName: null, parentEmail: null };
    }
}
