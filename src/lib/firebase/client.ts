
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config values are present. If not, log an error.
// This helps diagnose the 'auth/api-key-not-valid' error during development.
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  console.error(
    'Firebase configuration is missing or incomplete. Check your environment variables (NEXT_PUBLIC_FIREBASE_...). Required fields: apiKey, authDomain, projectId, appId.'
  );
  // You might want to throw an error here in development to make it more obvious
  // throw new Error('Firebase configuration is missing or incomplete.');
}


// Initialize Firebase
let app;
if (!getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Handle the error appropriately - maybe show a message to the user
        // or prevent Firebase-dependent features from loading.
        // For the API key error, this catch block might not execute if the SDK throws later.
    }
} else {
    app = getApp();
}


// Get Auth and Firestore instances
// Use conditional checks to avoid errors if initialization failed
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// Ensure auth and db are only exported if app was initialized successfully
// This prevents errors downstream if Firebase init fails.
if (!auth || !db) {
    console.error("Firebase Auth or Firestore could not be initialized. Check your configuration and initialization logic.");
    // Depending on your app's needs, you might want to throw an error here
    // or handle the lack of Firebase services gracefully elsewhere.
}


export { app, auth, db };

