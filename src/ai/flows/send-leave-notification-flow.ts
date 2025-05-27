
'use server';
/**
 * @fileOverview A Genkit flow to send leave application notifications to parents.
 *
 * - sendLeaveNotification - A function that handles composing and (conceptually) sending the email.
 * - SendLeaveNotificationInput - The input type for the sendLeaveNotification function.
 * - SendLeaveNotificationOutput - The return type for the sendLeaveNotification function.
 */

import { ai } from '@/ai/ai-instance'; // Corrected import path
import { z } from 'genkit';
import { format } from 'date-fns';

const SendLeaveNotificationInputSchema = z.object({
  parentEmail: z.string().email().describe("The parent's email address."),
  studentName: z.string().describe('The name of the student.'),
  leaveType: z.string().describe('The type of leave requested.'),
  startDate: z.string().describe('The start date of the leave (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the leave (YYYY-MM-DD).'),
  reason: z.string().describe('The reason for the leave application.'),
});
export type SendLeaveNotificationInput = z.infer<typeof SendLeaveNotificationInputSchema>;

const SendLeaveNotificationOutputSchema = z.object({
  success: z.boolean().describe('Whether the notification was sent successfully.'),
  message: z.string().describe('A message indicating the status of the notification.'),
  emailContent: z.string().optional().describe('The generated email content if successful.'),
});
export type SendLeaveNotificationOutput = z.infer<typeof SendLeaveNotificationOutputSchema>;

// This is the exported wrapper function that Next.js Server Actions or other server-side code will call.
export async function sendLeaveNotification(input: SendLeaveNotificationInput): Promise<SendLeaveNotificationOutput> {
  return sendLeaveNotificationFlow(input);
}

const emailPrompt = ai.definePrompt({
  name: 'leaveNotificationEmailPrompt',
  input: { schema: SendLeaveNotificationInputSchema },
  output: { schema: z.object({ emailBody: z.string(), emailSubject: z.string() }) },
  prompt: `
    You are an assistant responsible for drafting email notifications to parents about their child's leave application.
    The email should be formal and informative.

    Student Name: {{{studentName}}}
    Leave Type: {{{leaveType}}}
    Start Date: {{{startDate}}}
    End Date: {{{endDate}}}
    Reason: {{{reason}}}

    Generate an email subject and body for a notification to be sent to {{parentEmail}}.
    The email should inform the parent that a leave application has been submitted by their child, {{studentName}}.
    Include all the leave details provided above.
    The subject should be concise, like "Leave Application Submitted for {{studentName}}".
    The body should start with "Dear Parent,".
    Conclude by stating that the application is pending review.
  `,
});

const sendLeaveNotificationFlow = ai.defineFlow(
  {
    name: 'sendLeaveNotificationFlow',
    inputSchema: SendLeaveNotificationInputSchema,
    outputSchema: SendLeaveNotificationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await emailPrompt(input);
      if (!output || !output.emailBody || !output.emailSubject) {
        console.error('Failed to generate email content from prompt.');
        return { success: false, message: 'Failed to generate email content.' };
      }

      const { emailBody, emailSubject } = output;

      // --- !!! IMPORTANT: Actual Email Sending Logic !!! ---
      // This is where you would integrate with an actual email sending service
      // (e.g., SendGrid, Resend, AWS SES, Nodemailer with an SMTP server).
      // Genkit itself does not send emails directly without a plugin or custom tool.
      // For this prototype, we will simulate success and log the action.

      console.log('--- SIMULATING EMAIL SEND ---');
      console.log(`To: ${input.parentEmail}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body:\n${emailBody}`);
      console.log('--- EMAIL SEND SIMULATION COMPLETE ---');

      // In a real application, you would replace the console logs above with:
      // await emailService.send({
      //   to: input.parentEmail,
      //   subject: emailSubject,
      //   html: emailBody, // or text: emailBody
      // });

      return {
        success: true,
        message: 'Email notification (simulated) sent successfully to parent.',
        emailContent: `Subject: ${emailSubject}\n\n${emailBody}`,
      };
    } catch (error) {
      console.error('Error in sendLeaveNotificationFlow:', error);
      return {
        success: false,
        message: `An error occurred while processing the leave notification: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
);
