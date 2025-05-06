
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Ensure you have a .env.local file in the root of your project
// with the following Firebase configuration variables.
// These variables MUST be prefixed with NEXT_PUBLIC_ to be available on the client-side.
// Example .env.local content:
// NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
// NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef...
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (Optional)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// --- Configuration Validation ---
const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'measurementId' && key !== 'storageBucket' && key !== 'messagingSenderId' && !value) // Only apiKey, authDomain, projectId, appId are strictly required for auth/firestore basic functionality
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

let app;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (missingConfigKeys.length > 0) {
  console.error(
    `\n--- FIREBASE CONFIG ERROR ---` +
    `\nFirebase configuration is missing or incomplete.` +
    `\nPlease ensure the following environment variables are set in your .env.local file and prefixed with 'NEXT_PUBLIC_':` +
    `\n${missingConfigKeys.join('\n')}` +
    `\n\nCommon causes:` +
    `\n1. .env.local file is missing or in the wrong directory.` +
    `\n2. Variables are missing the 'NEXT_PUBLIC_' prefix.` +
    `\n3. The development server needs to be restarted after modifying .env.local.` +
    `\n4. Incorrect variable names or values copied from Firebase console.` +
    `\n\nFirebase services (Auth, Firestore) will NOT be initialized.` +
    `\n---------------------------\n`
  );
} else {
  // --- Firebase Initialization ---
  try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    } else {
        app = getApp();
        console.log("Firebase app already exists.");
    }

    // Get Auth and Firestore instances ONLY if app initialization was successful
    auth = getAuth(app);
    db = getFirestore(app);

  } catch (error: any) {
    console.error(
        `\n--- FIREBASE INIT FAILED ---` +
        `\nError during Firebase initialization: ${error.message}` +
        `\nCode: ${error.code || 'N/A'}` +
        `\n\nCheck your Firebase project settings and the configuration values in .env.local.` +
        `\nIs the API Key (${firebaseConfig.apiKey ? 'provided' : 'MISSING'}) correct?` +
        `\nIs the Auth Domain (${firebaseConfig.authDomain ? 'provided' : 'MISSING'}) correct?` +
        `\n----------------------------\n`
        );
    // Ensure auth and db remain null if initialization fails
    auth = null;
    db = null;
  }
}

// Export potentially null values; consuming code should handle this.
export { app, auth, db };
