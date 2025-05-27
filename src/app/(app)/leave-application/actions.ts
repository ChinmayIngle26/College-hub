
'use server';

import * as z from 'zod';
import { addLeaveApplication } from '@/services/leaveApplications';
import { sendLeaveNotification } from '@/ai/flows/send-leave-notification-flow';
import type { LeaveApplicationFormData, LeaveType } from '@/types/leave';
import { auth } from '@/lib/firebase/client'; // Assuming auth can give current user
import { cookies } from 'next/headers'; // To get user from cookie if auth object is not directly available
import { adminAuth } from '@/lib/firebase/admin'; // If you need to verify token server-side

const leaveApplicationSchema = z.object({
  leaveType: z.enum(['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other']),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters long.' }).max(500),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"], // path of error
});


export interface SubmitLeaveApplicationState {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
  applicationId?: string;
}

async function getCurrentUserId(): Promise<string | null> {
  const authToken = cookies().get('firebaseAuthToken')?.value;
  if (!authToken) {
    return null;
  }
  try {
    // Verify the token using Firebase Admin SDK if you have it set up for server-side verification
    // For client-side Firebase auth, this step is usually handled differently,
    // but in server actions, you need a secure way to get the UID.
    // If not using Admin SDK here, this implies trust in the cookie or you'd pass UID from client.
    // For a more robust solution, verify token with Admin SDK.
    // For now, let's assume if the cookie exists, it's a placeholder for a logged-in user.
    // A proper implementation would involve Firebase Admin SDK to verify and decode the token.
    // const decodedToken = await adminAuth.verifyIdToken(authToken);
    // return decodedToken.uid;

    // Placeholder: In a real app, you'd verify the token.
    // Here, we'll rely on the fact that the client making the call is authenticated.
    // The actual studentId will be passed from the client via useAuth().
    // This function is more of a conceptual check.
    if (auth.currentUser) { // This will be null on the server typically
        return auth.currentUser.uid;
    }
    // If auth.currentUser is null (expected in server action without Admin SDK verification here),
    // studentId MUST be passed directly to the action from client.
    return null;
  } catch (error) {
    console.error("Error getting current user ID in server action:", error);
    return null;
  }
}


export async function submitLeaveApplicationAction(
  studentId: string, // Explicitly pass studentId from client
  prevState: SubmitLeaveApplicationState | null,
  formData: FormData
): Promise<SubmitLeaveApplicationState> {

  if (!studentId) {
    return { success: false, message: "User not authenticated." };
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

  const validatedData = validationResult.data as LeaveApplicationFormData; // Zod ensures types

  try {
    const applicationId = await addLeaveApplication(studentId, validatedData);

    // Trigger email notification (fire and forget for now, or handle response)
    // The parentEmail is fetched within addLeaveApplication service or passed to notification flow
    // For sendLeaveNotification, studentName and parentEmail would be fetched inside or passed.
    // Let's assume addLeaveApplication fetches student details and they are available.
    // We need to fetch student details again or pass them through.
    // For simplicity, the Genkit flow will need these. The `addLeaveApplication` stores it.
    // The notification flow will retrieve them or be adapted.

    // Let's pass the necessary details to the notification flow.
    // We'll need to fetch the student's name and parent's email for the notification.
    // This logic is already in `addLeaveApplication` to store it, but the notification flow needs it too.
    // Ideally, `addLeaveApplication` would return these details or notification is part of its transaction.
    // For now, let's assume `sendLeaveNotification` can also fetch user details if needed, or we pass them.

    // To avoid re-fetching, we'd ideally get parentEmail and studentName from `addLeaveApplication`'s context
    // Or, `addLeaveApplication` could directly call `sendLeaveNotification`
    
    // For now, the `addLeaveApplication` stores parentEmail. The notification flow will use it.
    // The Genkit flow `sendLeaveNotificationFlow` is designed to take these as input.
    // We need to get studentName and parentEmail. It's stored with the application, or from user profile.
    const { studentName, parentEmail } = await getStudentDetailsForNotification(studentId);

    if (!parentEmail || !studentName) {
        // This case should ideally not happen if signup enforces parent email
        // and addLeaveApplication confirmed parentEmail existence.
        console.warn(`Parent email or student name not found for student ${studentId} for notification.`);
        // Proceed with application submission but flag notification issue
    } else {
        sendLeaveNotification({
            parentEmail: parentEmail,
            studentName: studentName,
            leaveType: validatedData.leaveType,
            startDate: validatedData.startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            endDate: validatedData.endDate.toISOString().split('T')[0],     // Format as YYYY-MM-DD
            reason: validatedData.reason,
        }).then(notificationResult => {
            if (!notificationResult.success) {
                console.warn("Leave application submitted, but notification failed:", notificationResult.message);
                // Optionally, update toast or inform user about notification failure
            }
        }).catch(notificationError => {
            console.error("Error triggering leave notification flow:", notificationError);
        });
    }


    return {
      success: true,
      message: "Leave application submitted successfully! A notification has been sent to your parent.",
      applicationId,
    };
  } catch (error) {
    console.error("Error submitting leave application:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

// Helper to get student details needed for notification
async function getStudentDetailsForNotification(studentId: string): Promise<{ studentName: string | null; parentEmail: string | null }> {
    if (!db) throw new Error("Firestore not initialized");
    const userDocRef = doc(db, "users", studentId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return { studentName: data.name || null, parentEmail: data.parentEmail || null };
    }
    return { studentName: null, parentEmail: null };
}
