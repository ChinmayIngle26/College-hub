
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Environment variables
const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

let adminApp: admin.app.App | undefined = undefined;
let adminInitializationError: Error | null = null;

if (typeof admin.initializeApp !== 'function') {
  const err = new Error("Firebase Admin SDK 'admin.initializeApp' is not a function. The 'firebase-admin' module may not be loaded correctly or is corrupted.");
  console.error("CRITICAL: Firebase Admin SDK load integrity error.", err.message, admin); // Log admin object for inspection
  adminInitializationError = err;
} else if (admin.apps.length === 0) { // Check if apps array exists and is empty
  try {
    let credentials;
    let credSource = "unknown";

    if (serviceAccountJsonString) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonString);
        credentials = admin.credential.cert(serviceAccount);
        credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
        console.log(`Firebase Admin: Attempting to initialize with ${credSource}.`);
      } catch (e: any) {
        console.warn(`Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON provided but failed to parse. Error: ${e.message}. Will try other methods.`);
      }
    }

    if (!credentials && serviceAccountPath && !isEdgeRuntime) {
      try {
        // Note: Dynamic require can sometimes be tricky with bundlers.
        // Ensure FIREBASE_ADMIN_SDK_PATH is an absolute path or resolvable by require.
        console.log(`Firebase Admin: Attempting to load service account from FIREBASE_ADMIN_SDK_PATH: '${serviceAccountPath}' (Not in Edge Runtime).`);
        const serviceAccount = require(serviceAccountPath);
        credentials = admin.credential.cert(serviceAccount);
        credSource = "FIREBASE_ADMIN_SDK_PATH";
        console.log(`Firebase Admin: Using credentials from ${credSource}.`);
      } catch (e: any) {
        console.warn(`Firebase Admin: Failed to load service account from FIREBASE_ADMIN_SDK_PATH ('${serviceAccountPath}'). Error: ${e.message}. Will try default initialization.`);
      }
    }

    if (credentials) {
      adminApp = admin.initializeApp({ credential: credentials });
      console.log(`Firebase Admin: Successfully initialized with explicit credentials from ${credSource}.`);
    } else {
      credSource = "default (GOOGLE_APPLICATION_CREDENTIALS env var or managed environment)";
      console.log(`Firebase Admin: Attempting default initialization (e.g., using GOOGLE_APPLICATION_CREDENTIALS env var for path, or managed environment).`);
      adminApp = admin.initializeApp();
      console.log(`Firebase Admin: Successfully initialized with ${credSource}.`);
    }
  } catch (error: any) {
    console.error(
      "CRITICAL: Firebase Admin SDK failed to initialize during primary attempts. Error:", 
      error.message, // Message
      error.code,    // Error code if available
      error.stack,   // Stack trace
      error          // Full error object
    );
    adminInitializationError = error;
    // No fallback admin.initializeApp here, as it's the source of the 'INTERNAL' error.
  }
} else {
  // admin.apps.length > 0
  adminApp = admin.app(); // Get the default app if already initialized
  console.log("Firebase Admin: SDK already initialized and an app instance exists.");
}

const adminAuth = adminApp ? admin.auth(adminApp) : null;
const adminDb = adminApp ? admin.firestore(adminApp) : null;

// Expose the initialization error for services to check if needed.
export { adminAuth, adminDb, adminApp, adminInitializationError };
