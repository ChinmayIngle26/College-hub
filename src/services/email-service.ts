
'use server';

import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const SENDER_EMAIL = process.env.SENDER_EMAIL; // The email address that will appear in the "From" field
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587; // Default to 587 if not specified
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (SENDER_EMAIL && SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER, // Your SMTP username
      pass: SMTP_PASS, // Your SMTP password
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('Nodemailer transporter verification error:', error);
    } else {
      console.log('Nodemailer transporter is ready to send emails.');
    }
  });

} else {
  console.warn(
    'Nodemailer is not configured. Missing one or more required environment variables: ' +
    'SENDER_EMAIL, SMTP_HOST, SMTP_USER, SMTP_PASS. Emails will not be sent.'
  );
}

/**
 * Sends an email using the configured Nodemailer transporter.
 * @param mailOptions Options for the email (to, subject, html, text).
 * @returns A promise that resolves if the email is sent successfully, or rejects with an error.
 */
export async function sendEmail(mailOptions: MailOptions): Promise<void> {
  if (!transporter) {
    console.error('Nodemailer transporter is not initialized. Cannot send email.');
    throw new Error('Email service is not configured.');
  }

  const optionsWithFrom = {
    ...mailOptions,
    from: SENDER_EMAIL, // Use the configured sender email
  };

  try {
    const info = await transporter.sendMail(optionsWithFrom);
    console.log('Email sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only if using ethereal.email
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
