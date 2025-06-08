
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

// Pre-check: Is the firebase-admin module loaded correctly?
if (typeof admin.initializeApp !== 'function' || typeof admin.credential?.cert !== 'function') {
  const integrityErrorMsg = "CRITICAL: Firebase Admin SDK module integrity check failed. 'admin.initializeApp' or 'admin.credential.cert' is not a function. The 'firebase-admin' module may not be loaded correctly or is corrupted.";
  console.error(integrityErrorMsg);
  adminInitializationError = new Error(integrityErrorMsg);
} else if (admin.apps.length === 0) {
  console.log(`Firebase Admin: No existing app. Proceeding with new initialization. isEdgeRuntime: ${isEdgeRuntime}`);
  let credentials;
  let credSource = "unknown";

  try {
    // Phase 1: Prepare Credentials
    if (serviceAccountJsonString) {
      console.log("Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON is set.");
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonString);
        credentials = admin.credential.cert(serviceAccount);
        credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
        console.log(`Firebase Admin: Successfully parsed credentials from ${credSource}.`);
      } catch (e: any) {
        const parseErrorMsg = `Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON parsing failed. Error: ${e.message}.`;
        console.error(parseErrorMsg, e); // Log the full error
        adminInitializationError = new Error(parseErrorMsg + " Admin SDK cannot initialize in Edge without valid JSON credentials.");
      }
    } else {
      console.log("Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS_JSON is NOT set.");
    }

    // Attempt path-based credentials only if not in Edge and JSON string wasn't successful and no prior critical error
    if (!credentials && serviceAccountPath && !isEdgeRuntime && !adminInitializationError) {
      console.log(`Firebase Admin: Attempting to load service account from FIREBASE_ADMIN_SDK_PATH: '${serviceAccountPath}' (Not in Edge Runtime).`);
      try {
        const serviceAccountModule = require(serviceAccountPath); // Using require for Node.js environment
        credentials = admin.credential.cert(serviceAccountModule);
        credSource = "FIREBASE_ADMIN_SDK_PATH";
        console.log(`Firebase Admin: Using credentials from ${credSource}.`);
      } catch (e: any) {
        console.warn(`Firebase Admin: Failed to load service account from FIREBASE_ADMIN_SDK_PATH ('${serviceAccountPath}'). Error: ${e.message}.`);
        // Not setting adminInitializationError here, as default init might still work in Node.js
      }
    }

    // Phase 2: Initialize App
    if (!adminInitializationError) { // Proceed only if no critical errors so far
      if (credentials) {
        adminApp = admin.initializeApp({ credential: credentials });
        console.log(`Firebase Admin: Successfully initialized with explicit credentials from ${credSource}.`);
      } else if (isEdgeRuntime) {
        const edgeErrorMsg = "Firebase Admin: Default initialization skipped in Edge Runtime. GOOGLE_APPLICATION_CREDENTIALS_JSON must be provided and valid for Edge.";
        console.error(edgeErrorMsg);
        adminInitializationError = new Error(edgeErrorMsg);
      } else {
        // Not in Edge, and no explicit credentials from JSON or path were successful. Attempt default.
        credSource = "default (e.g., GOOGLE_APPLICATION_CREDENTIALS env var for path, or managed environment)";
        console.log(`Firebase Admin: Attempting default initialization (Runtime: ${process.env.NEXT_RUNTIME || 'undefined'}). This may use Node.js specific APIs.`);
        adminApp = admin.initializeApp();
        console.log(`Firebase Admin: Successfully initialized with ${credSource}.`);
      }
    }
  } catch (error: any) {
    const criticalErrorMsg = "CRITICAL: Firebase Admin SDK failed to initialize during primary attempts.";
    console.error(criticalErrorMsg, "Error:", error.message, "Code:", error.code, "Stack:", error.stack, error);
    adminInitializationError = error; // Ensure the original error is captured
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
    // This case indicates something went wrong but adminApp wasn't set, and no error was caught *after* the initial check
    // This can happen if the initial module integrity check failed, and adminInitializationError was set there.
    if (adminInitializationError) {
       console.error(`Firebase Admin: Final status - SDK NOT INITIALIZED due to earlier error: ${adminInitializationError.message}`);
    } else {
       console.warn("Firebase Admin: Final status - SDK state indeterminate (no app, no explicit error after init block). This should not happen.");
    }
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
