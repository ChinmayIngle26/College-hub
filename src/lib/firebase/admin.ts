
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Path to your service account key JSON file
// IMPORTANT: Store this file securely and DO NOT commit it to your public repository.
// It's recommended to use environment variables for the service account credentials in production.
// For local development, you can point to the file path.
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH; // e.g., './path/to/your/serviceAccountKey.json'
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let adminApp: admin.app.App;

if (!admin.apps.length) {
  if (serviceAccountPath) {
    try {
      const serviceAccount = require(serviceAccountPath); // Dynamically require based on path
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: `https://${projectId}.firebaseio.com` // Optional: If using Realtime Database
      });
      console.log("Firebase Admin SDK initialized with service account file.");
    } catch (e: any) {
      console.error("Error initializing Firebase Admin SDK with service account file:", e.message);
      console.warn("Falling back to default app credentials if available (e.g., in Firebase Hosting/Functions environment).");
      adminApp = admin.initializeApp(); // Attempt to initialize with default credentials
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV === 'production') {
    // For environments like Google Cloud Functions, Firebase Hosting, or when GOOGLE_APPLICATION_CREDENTIALS is set
    adminApp = admin.initializeApp();
    console.log("Firebase Admin SDK initialized with default/environment credentials.");
  } else {
    console.warn(
        "Firebase Admin SDK could not be initialized. " +
        "Ensure FIREBASE_ADMIN_SDK_PATH environment variable points to your service account key JSON file, " +
        "or that the GOOGLE_APPLICATION_CREDENTIALS environment variable is set, " +
        "or that the app is running in a Firebase/Google Cloud managed environment."
    );
    // adminApp remains uninitialized, subsequent adminAuth calls might fail
  }
} else {
  adminApp = admin.app();
  console.log("Firebase Admin SDK already initialized.");
}

const adminAuth = adminApp! ? admin.auth(adminApp) : null; // Use adminApp if initialized
const adminDb = adminApp! ? admin.firestore(adminApp) : null; // Use adminApp if initialized

export { adminAuth, adminDb, adminApp };
