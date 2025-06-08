
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Environment variables
const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;

// Determine runtime environment
const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';
const currentEnvInfo = `NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`;

let adminApp: admin.app.App | undefined = undefined;
let adminInitializationError: Error | null = null;

console.log(`Firebase Admin: Preparing to initialize. ${currentEnvInfo}`);

if (typeof admin.initializeApp !== 'function') {
  const err = new Error("Firebase Admin SDK 'admin.initializeApp' is not a function. The 'firebase-admin' module may not be loaded correctly or is corrupted.");
  console.error("CRITICAL: Firebase Admin SDK load integrity error.", err.message);
  adminInitializationError = err;
} else if (admin.apps.length === 0) {
  console.log(`Firebase Admin: No existing app. Proceeding with new initialization. isEdgeRuntime: ${isEdgeRuntime}`);
  try {
    let credentials;
    let credSource = "unknown";

    if (serviceAccountJsonString) {
      console.log("Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON is set.");
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonString);
        credentials = admin.credential.cert(serviceAccount);
        credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
        console.log(`Firebase Admin: Successfully parsed credentials from ${credSource}.`);
      } catch (e: any) {
        const parseErrorMsg = `Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON parsing failed. Error: ${e.message}.`;
        console.warn(parseErrorMsg);
        // This is a critical failure if in Edge and JSON is the only way.
        if (isEdgeRuntime) {
          adminInitializationError = new Error(parseErrorMsg + " Admin SDK cannot initialize in Edge without valid JSON credentials.");
        }
      }
    } else {
      console.log("Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON is NOT set.");
    }

    // Attempt path-based credentials only if not in Edge and JSON string wasn't successful
    if (!credentials && serviceAccountPath && !isEdgeRuntime) {
      console.log(`Firebase Admin: Attempting to load service account from FIREBASE_ADMIN_SDK_PATH: '${serviceAccountPath}' (Not in Edge Runtime).`);
      try {
        const serviceAccountModule = require(serviceAccountPath); // Using require for Node.js environment
        credentials = admin.credential.cert(serviceAccountModule);
        credSource = "FIREBASE_ADMIN_SDK_PATH";
        console.log(`Firebase Admin: Using credentials from ${credSource}.`);
      } catch (e: any) {
        console.warn(`Firebase Admin: Failed to load service account from FIREBASE_ADMIN_SDK_PATH ('${serviceAccountPath}'). Error: ${e.message}.`);
      }
    }

    if (credentials) {
      adminApp = admin.initializeApp({ credential: credentials });
      console.log(`Firebase Admin: Successfully initialized with explicit credentials from ${credSource}.`);
    } else if (isEdgeRuntime) {
      // If in Edge and 'credentials' is still undefined (JSON not provided/parsed), we must not proceed.
      // adminInitializationError might have been set by JSON parsing failure.
      if (!adminInitializationError) {
        adminInitializationError = new Error("Firebase Admin: Default initialization skipped in Edge Runtime. GOOGLE_APPLICATION_CREDENTIALS_JSON must be provided and valid.");
      }
      console.error(`Firebase Admin: Initialization failed in Edge Runtime. Reason: ${adminInitializationError.message}`);
    } else {
      // Not in Edge, and no explicit credentials from JSON or path were successful. Attempt default.
      // This block should only be reached if !isEdgeRuntime.
      credSource = "default (e.g., GOOGLE_APPLICATION_CREDENTIALS env var for path, or managed environment)";
      console.log(`Firebase Admin: Attempting default initialization (Runtime: ${process.env.NEXT_RUNTIME || 'undefined'}). This may use Node.js specific APIs.`);
      adminApp = admin.initializeApp(); // This call might use 'child_process' or 'fs'
      console.log(`Firebase Admin: Successfully initialized with ${credSource}.`);
    }
  } catch (error: any) {
    const criticalErrorMsg = "CRITICAL: Firebase Admin SDK failed to initialize during primary attempts.";
    console.error(criticalErrorMsg, "Error:", error.message, "Code:", error.code, "Stack:", error.stack, error);
    adminInitializationError = error; // Ensure the original error is captured
    // Ensure a more specific message if it's a known pattern for `child_process`
    if (error.message && (error.message.includes('child_process') || error.message.includes('fs'))) {
        adminInitializationError = new Error (`${criticalErrorMsg} Detected Node.js module error ('${error.message}') in runtime '${process.env.NEXT_RUNTIME || 'undefined'}'.`);
    }
  }
} else {
  adminApp = admin.app(); // Get the default app if already initialized
  console.log("Firebase Admin: SDK already initialized, using existing app instance.");
}

// Assign auth and db only if adminApp was successfully initialized
const adminAuth = adminApp ? admin.auth(adminApp) : null;
const adminDb = adminApp ? admin.firestore(adminApp) : null;

if (adminInitializationError && !adminApp) {
    console.error(`Firebase Admin: Final status - SDK NOT INITIALIZED. Error: ${adminInitializationError.message}`);
} else if (adminApp) {
    console.log("Firebase Admin: Final status - SDK INITIALIZED.");
} else {
    console.warn("Firebase Admin: Final status - SDK state indeterminate (no app, no explicit error after init block). This should not happen.");
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
