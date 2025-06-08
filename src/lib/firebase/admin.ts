
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
// New: Expecting the JSON content as a string for this variable
const gaeCredentialsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON; 
// Existing: Usually a file path for Node.js environments or default GCloud services
const gaeCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS; 

// Detect if running in Next.js Edge Runtime
const IS_EDGE_RUNTIME = process.env.NEXT_RUNTIME === 'edge';

let adminApp: admin.app.App;

if (!admin.apps.length) {
  let initialized = false;
  let initError: any = null;

  try {
    // Attempt 1: Use explicit JSON string from GOOGLE_APPLICATION_CREDENTIALS_JSON
    // This is the preferred method for Edge Runtime if using service account keys.
    if (gaeCredentialsJsonString) {
      try {
        const serviceAccountJson = JSON.parse(gaeCredentialsJsonString);
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJson),
        });
        console.log("Firebase Admin SDK initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON.");
        initialized = true;
      } catch (e) {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS_JSON provided but failed to parse or use. Will try other methods.", e);
      }
    }

    // Attempt 2: Use FIREBASE_ADMIN_SDK_PATH (if not in Edge runtime and path is provided)
    if (!initialized && serviceAccountPath && !IS_EDGE_RUNTIME) {
      try {
        const serviceAccount = require(serviceAccountPath); // Node.js specific, uses 'fs' and 'path' implicitly
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized with service account file via FIREBASE_ADMIN_SDK_PATH.");
        initialized = true;
      } catch (e: any) {
        console.warn("Error initializing Firebase Admin SDK with FIREBASE_ADMIN_SDK_PATH (file path):", e.message, ". Will try other methods.");
      }
    }

    // Attempt 3: Default initialization.
    // For Node.js, this relies on GOOGLE_APPLICATION_CREDENTIALS env var (often a path) or GAE/Cloud Run environment variables.
    // For Edge, this might only work if deployed in a Google managed Edge env with implicit credentials,
    // and if GOOGLE_APPLICATION_CREDENTIALS (if set) is not a file path that it tries to read.
    if (!initialized) {
      if (IS_EDGE_RUNTIME && (gaeCredentialsPath || serviceAccountPath)) {
          console.warn("In Edge Runtime, and service account seems to be via file path (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH). Default initialization might fail if it attempts file access. Prefer GOOGLE_APPLICATION_CREDENTIALS_JSON for Edge.");
      }
      adminApp = admin.initializeApp(); // Let Firebase Admin SDK try to find credentials
      console.log("Firebase Admin SDK attempting default initialization (e.g., GOOGLE_APPLICATION_CREDENTIALS path, or managed environment).");
      initialized = true; 
    }

  } catch (error: any) {
    initError = error;
    console.error(
      "CRITICAL: Firebase Admin SDK failed to initialize during primary attempts. Error:", error.message
    );
    // Ensure adminApp is an app instance, even if non-functional, to prevent downstream errors.
    if (!admin.apps.length) {
        adminApp = admin.initializeApp(undefined, `fallbackAdminInitErrorApp-${Date.now()}`);
        console.warn("Initialized a fallback, likely non-functional adminApp instance due to critical initialization failure.");
    } else {
        adminApp = admin.app(); // Should pick the one already created if error was in subsequent logic
    }
  }

  if (!initialized && !initError) {
      console.error("CRITICAL: Firebase Admin SDK was not initialized, and no specific error was caught during attempts. This state should not be reached.");
      if (!admin.apps.length) {
        adminApp = admin.initializeApp(undefined, `fallbackAdminUninitializedApp-${Date.now()}`);
        console.warn("Initialized a fallback, likely non-functional adminApp instance as no initialization path succeeded.");
      } else {
        adminApp = admin.app();
      }
  }

} else {
  adminApp = admin.app(); // Get the default app if already initialized
  // console.log("Firebase Admin SDK already initialized.");
}

// Check the name of the app to ensure it's not one of our fallback/error-state initializations
const isFunctionalAdminApp = adminApp && adminApp.name && !adminApp.name.startsWith('fallbackAdmin');

const adminAuth = isFunctionalAdminApp ? admin.auth(adminApp) : null;
const adminDb = isFunctionalAdminApp ? admin.firestore(adminApp) : null;

export { adminAuth, adminDb, adminApp };
