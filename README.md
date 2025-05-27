
# Advanced Student ERP Dashboard (Next.js & Firebase)

This is a Next.js application serving as a student ERP dashboard, integrated with Firebase for authentication and database services.

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

Create a `.env.local` file in the root of your project. Copy the configuration values from your Firebase web app setup (Step 3b) into this file.
**The variables MUST be prefixed with `NEXT_PUBLIC_`.**

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
```

**Important:** Restart your development server (`npm run dev` or `yarn dev`) after creating or modifying the `.env.local` file.

### 5. Initial Admin User Setup & Role Assignment

For the admin panel to function correctly with Firestore security rules, the designated admin user (e.g., `admin@gmail.com`) needs to have their role set to `admin` in their Firestore user document.

**a. Sign Up the Admin User:**
   Run the application (`npm run dev`) and sign up using the email address you've designated as the admin (e.g., `admin@gmail.com` as defined in `src/app/(app)/admin/page.tsx`). **Use a temporary password if needed, and remember it.**
   During sign-up, the system will automatically assign the role `student` (as per `src/app/signup/page.tsx`). This will be overridden in the next step.

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

### 7. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application should now be running, typically at `http://localhost:9002` (as per your `package.json` dev script). You should be able to sign up, sign in, and access protected pages. Admins should have access to the admin panel and its functionalities.

## Firebase Services Used

*   **Firebase Authentication:** For user sign-up and sign-in.
*   **Firestore:** As a NoSQL database to store user profiles and potentially other application data.

## Troubleshooting

*   **"Firebase: Error (auth/api-key-not-valid)"**:
    *   Ensure your `.env.local` file is correctly set up with the `NEXT_PUBLIC_` prefix for all Firebase config variables.
    *   Verify the API key and other config values are correct from your Firebase project settings.
    *   Restart your development server after changes to `.env.local`.
*   **"Missing or insufficient permissions" (Firestore Error)**:
    *   This usually means your Firestore security rules are too restrictive, not deployed correctly, or the user performing the action does not have the required role (e.g., an admin action attempted by a non-admin user, or server-side code attempting to access data without proper unauthenticated access rules if necessary, such as for `systemSettings`).
    *   **1. Deploy Security Rules (MOST COMMON FIX):** Ensure you have deployed the `firestore.rules` file using `firebase deploy --only firestore:rules` (see Step 6). Check the Firebase Console (Firestore Database > Rules tab) to see the currently active rules.
    *   **2. Set Admin Role:** For admin functionalities, **CRUCIALLY**, ensure the admin user's document in the `users` collection in Firestore has the `role` field set to `admin` (see Step 5b). The document ID for this user in the `users` collection must be their Firebase Authentication UID.
    *   **3. Check Rules Logic:** Review the rules in `firestore.rules` to confirm they grant the necessary permissions for the operations your app is trying to perform. For example:
        *   Can authenticated users create their own user document in the `users` collection upon signup (with specific constraints, e.g., only setting their own role to 'student')?
        *   Can authenticated users read their own user document?
        *   Can users with the 'admin' role `list` (get all documents) from the `users` collection?
        *   Can users with the 'admin' role `create`, `update`, or `delete` documents in the `users` collection?
        *   Can the `systemSettings/appConfiguration` document be read by unauthenticated users/server processes (e.g., for `generateMetadata` in `src/app/layout.tsx`)? Admins should have write access.
    *   **4. Verify User Authentication:** Ensure the user is actually signed in when the operation is attempted. Check the `user` object from `useAuth()` in your components.
    *   **5. Check Firestore Data and Document IDs:** Verify that the document paths your code is trying to access are correct (e.g., `users/{UID}`, `systemSettings/appConfiguration`).
    *   **6. Firebase Console Rules Simulator:** Use the Rules Playground in the Firebase Console (Firestore Database > Rules tab) to test your rules against specific operations (read, write, list) by specific users (provide their UID and mock data, including their `role` if it's 'admin'). This is very helpful for debugging.
*   **Blank screen after login/redirect issues**:
    *   Check the browser console for errors.
    *   Verify the `middleware.ts` logic and ensure cookies are being set/cleared correctly if you're relying on them for auth checks in middleware.
    *   Ensure `AuthProvider` wraps your application in `src/app/layout.tsx`.

## Further Development

*   Implement data fetching for other services (attendance, grades, appointments, etc.) from Firestore or other backend services.
*   Refine Firestore security rules as you add more collections and features.
*   Add error handling and loading states for all data fetching operations.
*   Implement admin functionalities and role-based access control.

