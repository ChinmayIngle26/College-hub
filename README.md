
# Advanced Student ERP Dashboard (Next.js & Firebase)

This is a Next.js application serving as a student ERP dashboard, integrated with Firebase for authentication and database services. It also uses Nodemailer for sending email notifications.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Firebase CLI: Install it globally if you haven't already:
    ```bash
    npm install -g firebase-tools
    ```

### 1. Clone the Repository (if applicable)

If you're working from a cloned repository:
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Firebase Setup

This project uses Firebase for Authentication and Firestore database.

**a. Create a Firebase Project:**
   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).

**b. Add a Web App to Your Firebase Project:**
   In your Firebase project, go to Project Settings > General. Under "Your apps", click the Web icon (`</>`) to add a new web app.
   - Register the app (give it a nickname).
   - Firebase Hosting is NOT required for this setup if you're running Next.js locally or deploying it elsewhere.
   - After registering, Firebase will provide you with a `firebaseConfig` object. You'll need these values.

**c. Enable Firebase Services:**
   - **Authentication:** In the Firebase console, go to Authentication (Build > Authentication). Click "Get started" and enable the "Email/Password" sign-in method.
   - **Firestore Database:** In the Firebase console, go to Firestore Database (Build > Firestore Database). Click "Create database".
     - Start in **production mode**. You will set up security rules next.
     - Choose a Firestore location (this cannot be changed later).

### 4. Environment Variables

Create a `.env.local` file in the root of your project. Copy the configuration values from your Firebase web app setup (Step 3b) and your email provider into this file.
**The Firebase variables MUST be prefixed with `NEXT_PUBLIC_`.**

```env
# .env.local

# Firebase Config (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxxxx
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (Optional, if you use Analytics)

# Genkit (if using, ensure your Google AI API key is set here or in your environment)
# GOOGLE_GENAI_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# Nodemailer SMTP Configuration (for sending emails)
# Replace with your actual SMTP server details and credentials
# See section "7. Email Configuration (Nodemailer)" for detailed setup, including Gmail specifics.
SENDER_EMAIL=your-sender-email@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587 # Or 465 for SSL
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password

# Firebase Admin SDK (Optional, for server-side operations if needed, e.g., token verification)
# If you are using Firebase Admin SDK for server-side operations (like in src/lib/firebase/admin.ts),
# you might need to point to your service account key JSON file.
# Ensure this file is NOT committed to your repository and is kept secure.
# FIREBASE_ADMIN_SDK_PATH=./path-to-your-service-account-key.json
# Alternatively, for environments like Google Cloud Functions or Firebase Hosting,
# the SDK can often initialize with default credentials if GOOGLE_APPLICATION_CREDENTIALS is set
# or if running in a Google managed environment.
```

**Important:** Restart your development server (`npm run dev` or `yarn dev`) after creating or modifying the `.env.local` file.

### 5. Initial Admin User Setup & Role Assignment

For the admin panel to function correctly with Firestore security rules, the designated admin user (e.g., `admin@gmail.com`) needs to have their role set to `admin` in their Firestore user document.

**a. Sign Up the Admin User:**
   Run the application (`npm run dev`) and sign up using the email address you've designated as the admin (e.g., `admin@gmail.com` as defined in `src/app/(app)/admin/page.tsx`). **Use a temporary password if needed, and remember it.**
   During sign-up, the system will automatically assign the role `student` (as per `src/app/signup/page.tsx`). This will be overridden in the next step. Remember to also provide a "Parent's Email" during signup as it's now a required field.

**b. Manually Set Admin Role in Firestore:**
   - Go to your Firebase Console -> Firestore Database.
   - Navigate to the `users` collection.
   - Find the document corresponding to the admin user you just signed up (the document ID will be the user's UID from Firebase Authentication). You can find the UID by going to Firebase Console > Authentication > Users tab.
   - **Add or update the `role` field in that document. Set its value to `admin` (as a string) and save the document.** If the `role` field already exists (e.g., set to `student` during signup), change it to `admin`.

   This step is **CRUCIAL** because the Firestore security rules (`firestore.rules`) use this `role` field to grant admin-level permissions.

### 6. Deploy Firestore Security Rules

The project includes a `firestore.rules` file that defines security for your database (e.g., users can only read/write their own data, admins have broader access, and system settings are publicly readable). You **MUST** deploy these rules to your Firebase project to ensure the application functions correctly and securely.

**Follow these step-by-step instructions to deploy your Firestore rules:**

**Step 1: Log in to Firebase CLI**
   If you haven't already, open your terminal and log in to Firebase:
   ```bash
   firebase login
   ```
   This will open a browser window for authentication.

**Step 2: Select Your Firebase Project**
   Ensure your terminal is in the root directory of this project. If you have multiple Firebase projects, or if this is the first time using the Firebase CLI with this project directory, you need to associate it with your Firebase project:
   ```bash
   firebase use --add
   ```
   Follow the prompts to select the Firebase project you created in "3. Firebase Setup" (Step 3a).
   You can verify the currently selected project by running:
   ```bash
   firebase use
   ```

**Step 3: Deploy the Rules**
   Once logged in and the correct project is selected, deploy the Firestore security rules by running the following command from your project's root directory (where `firebase.json` and `firestore.rules` are located):
   ```bash
   firebase deploy --only firestore:rules
   ```
   This command reads the `firestore.rules` file (as specified in your `firebase.json`) and applies them to your Firestore database in the selected Firebase project.

**Important Considerations:**
*   **Timing:** Ensure this is done **after** you have manually set the admin role for the admin user in Firestore (Step 5b) if you want the admin to have immediate access based on these rules. If rules are deployed before the admin role is set, the admin user might not have the necessary permissions for admin actions.
*   **Verification:** After deployment, you can verify that the rules have been updated by going to your Firebase Console -> Firestore Database -> Rules tab. The content there should match your local `firestore.rules` file.

### 7. Email Configuration (Nodemailer)

For the leave application notifications to be sent to parents, you need to configure an SMTP server. The application uses Nodemailer for this.

**a. Obtain SMTP Credentials:**
   You will need the following from your email provider (e.g., Gmail, SendGrid, Mailgun, AWS SES, or your own SMTP server):
   - Sender Email Address (the "From" address, e.g., `chinmayingle26@gmail.com` if using your Gmail)
   - SMTP Host (e.g., `smtp.gmail.com` for Gmail)
   - SMTP Port (e.g., `587` for TLS with Gmail, or `465` for SSL)
   - SMTP Username (e.g., `chinmayingle26@gmail.com` for Gmail)
   - SMTP Password (your Gmail password or an App Password if using Gmail with 2FA)

**b. Set Environment Variables:**
   Add these credentials to your `.env.local` file as shown in Step 4. For example, if you were using a general SMTP provider:
   ```env
   # General SMTP Example
   SENDER_EMAIL=your-sender-email@example.com
   SMTP_HOST=smtp.yourprovider.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password_or_app_password
   ```
   **Never commit your SMTP password directly into your code or repository.**

**c. Gmail Specifics (if using Gmail with `chinmayingle26@gmail.com`):**

   If you're using your Gmail account (`chinmayingle26@gmail.com`) to send emails, you have two main options:

   **Option 1: Use an App Password (Recommended if you have 2-Step Verification enabled)**
   This is the more secure method.
   1.  **Enable 2-Step Verification:** If not already enabled, go to your Google Account settings ([https://myaccount.google.com/security](https://myaccount.google.com/security)) and enable 2-Step Verification.
   2.  **Generate an App Password:**
       *   Go to App passwords: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (you might need to sign in again).
       *   Under "Select app," choose "Mail."
       *   Under "Select device," choose "Other (Custom name)." Enter a name like "StudentERP App."
       *   Click "Generate."
       *   Google will display a 16-character App Password. **Copy this password immediately and save it securely.** You won't be able to see it again.
   3.  **Update `.env.local` for Gmail with App Password:**
       ```env
       # .env.local (Gmail with App Password Example)
       SENDER_EMAIL=chinmayingle26@gmail.com
       SMTP_HOST=smtp.gmail.com
       SMTP_PORT=587
       SMTP_USER=chinmayingle26@gmail.com
       SMTP_PASS=YOUR_16_CHARACTER_APP_PASSWORD # Paste the App Password here
       ```

   **Option 2: Enable "Less Secure App Access" (Not Recommended; May Not Be Available)**
   This method is less secure and Google is phasing it out.
   1.  Go to [https://myaccount.google.com/lesssecureapps](https://myaccount.google.com/lesssecureapps) and turn the setting ON for `chinmayingle26@gmail.com`.
       *   If this option is not available, you MUST use an App Password.
   2.  **Update `.env.local` for Gmail with Less Secure App Access:**
       ```env
       # .env.local (Gmail with Less Secure App Access - Not Recommended)
       SENDER_EMAIL=chinmayingle26@gmail.com
       SMTP_HOST=smtp.gmail.com
       SMTP_PORT=587
       SMTP_USER=chinmayingle26@gmail.com
       SMTP_PASS=YOUR_REGULAR_GMAIL_PASSWORD # Your chinmayingle26@gmail.com password
       ```

   **Important Gmail Notes:**
   *   Gmail has sending limits for free accounts (typically 100-500 emails per day). For a production application, consider a dedicated transactional email service (SendGrid, Resend, AWS SES, etc.).
   *   If emails are not sending, Google might be temporarily blocking sign-in attempts it deems suspicious. Check your Gmail security activity.

**d. Restart Development Server:**
   After setting these environment variables, restart your development server (`npm run dev`). The server console should indicate if Nodemailer was able to initialize correctly or if there were configuration issues.

### 8. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application should now be running, typically at `http://localhost:9002` (as per your `package.json` dev script). You should be able to sign up, sign in, and access protected pages. Admins should have access to the admin panel and its functionalities. Students applying for leave should trigger an email notification to their parent's email (if configured correctly).

## Firebase Services Used

*   **Firebase Authentication:** For user sign-up and sign-in.
*   **Firestore:** As a NoSQL database to store user profiles, system settings, and leave applications.

## Troubleshooting

*   **"Firebase: Error (auth/api-key-not-valid)"**:
    *   Ensure your `.env.local` file is correctly set up with the `NEXT_PUBLIC_` prefix for all Firebase config variables.
    *   Verify the API key and other config values are correct from your Firebase project settings.
    *   Restart your development server after changes to `.env.local`.
*   **"Missing or insufficient permissions" (Firestore Error)**:
    *   This usually means your Firestore security rules are too restrictive, not deployed correctly, or the user performing the action does not have the required role.
    *   **1. Deploy Security Rules (MOST COMMON FIX):** Ensure you have deployed the `firestore.rules` file using `firebase deploy --only firestore:rules` (see Step 6). Check the Firebase Console (Firestore Database > Rules tab) to see the currently active rules.
    *   **2. Set Admin Role:** For admin functionalities, ensure the admin user's document in the `users` collection in Firestore has the `role` field set to `admin` (see Step 5b).
    *   **3. Check Rules Logic:** Review `firestore.rules`.
    *   **4. Verify User Authentication & Student ID**: Ensure the user is signed in. For operations like fetching leave applications, confirm the `studentId` being queried matches `request.auth.uid` as per your rules.
    *   **5. Firebase Console Rules Simulator:** Use the Rules Playground in the Firebase Console (Firestore Database > Rules tab) to test operations.
*   **Email Not Sending (Leave Notifications)**:
    *   **Check Nodemailer Configuration:** Ensure `SENDER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` are correctly set in `.env.local`. See Step 7 for Gmail specifics.
    *   **Restart Server:** Restart the dev server after changing `.env.local`.
    *   **Check Server Logs:** Look for Nodemailer errors or success messages in your Next.js server console output.
    *   **SMTP Provider Issues:** Verify your SMTP credentials are correct and your provider isn't blocking the connection (e.g., firewall, rate limits, security settings like Gmail's "less secure app access" or App Password requirements).
    *   **Spam Folder:** Check the recipient's spam/junk folder.
*   **Blank screen after login/redirect issues**:
    *   Check the browser console for errors.
    *   Verify the `middleware.ts` logic.
    *   Ensure `AuthProvider` wraps your application.

## Further Development

*   Implement data fetching for other services (attendance, grades, appointments, etc.) from Firestore or other backend services.
*   Refine Firestore security rules as you add more collections and features.
*   Add error handling and loading states for all data fetching operations.
*   Implement admin functionalities for managing leave applications (approve/reject).
*   Consider a more robust email solution for production (e.g., SendGrid, Resend) if Nodemailer with a personal SMTP has limitations.

