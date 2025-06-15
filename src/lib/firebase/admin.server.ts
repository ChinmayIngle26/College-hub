
// src/lib/firebase/admin.server.ts
console.log("[AdminServer] File Start: admin.server.ts is being executed.");
console.log(`[AdminServer] NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);

import type { app as AdminAppType, auth as AdminAuthType, firestore as AdminFirestoreType } from 'firebase-admin';

let admin: any; // Using 'any' to allow for checks before strong typing
let adminApp: AdminAppType.App | undefined = undefined;
let adminAuth: AdminAuthType.Auth | null = null;
let adminDb: AdminFirestoreType.Firestore | null = null;
let adminInitializationError: Error | null = null;

try {
    console.log("[AdminServer] Attempting to import 'firebase-admin'.");
    // Using require for CJS compatibility, as Next.js might be treating it this way for external packages.
    admin = require('firebase-admin'); 
    console.log("[AdminServer] 'firebase-admin' imported successfully.");

    if (typeof admin.initializeApp !== 'function') {
        const integrityErrorMsg = "[AdminServer] CRITICAL: 'firebase-admin' module integrity check failed. 'admin.initializeApp' is not a function. The 'firebase-admin' module might be corrupted or not loaded as expected in this environment.";
        console.error(integrityErrorMsg);
        adminInitializationError = new Error(integrityErrorMsg);
    } else {
        console.log("[AdminServer] 'admin.initializeApp' function IS available.");
        if (admin.apps.length === 0) {
            console.log("[AdminServer] No existing Firebase admin app instances found. Proceeding with new initialization.");
            let credentials;
            let credSource = "unknown";
            const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

            if (serviceAccountJsonString) {
                credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON (environment variable string)";
                console.log(`[AdminServer] Found ${credSource}. Attempting to parse.`);
                try {
                    const serviceAccount = JSON.parse(serviceAccountJsonString);
                    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                        const validationError = new Error(`[AdminServer] Parsed ${credSource} is missing one or more required fields (project_id, private_key, client_email).`);
                        console.error(validationError.message);
                        adminInitializationError = validationError;
                    } else {
                        credentials = admin.credential.cert(serviceAccount);
                        console.log(`[AdminServer] Successfully parsed and created credentials object from ${credSource}. Project ID from JSON: ${serviceAccount.project_id}`);
                    }
                } catch (e: any) {
                    const parseErrorMsg = `[AdminServer] Parsing ${credSource} FAILED. Error: ${e.message}. Ensure the JSON string is complete and valid.`;
                    console.error(parseErrorMsg, e);
                    adminInitializationError = new Error(parseErrorMsg);
                }
            } else {
                console.log("[AdminServer] GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is NOT set. Will attempt to use Application Default Credentials (ADC).");
                credSource = "Application Default Credentials (ADC)";
            }

            if (!adminInitializationError) { // Proceed only if no credential errors so far
                try {
                    console.log(`[AdminServer] Attempting admin.initializeApp() using ${credSource}.`);
                    // If credentials object exists, use it; otherwise, initializeApp() will use ADC.
                    adminApp = admin.initializeApp(credentials ? { credential: credentials } : undefined);
                    
                    if (adminApp && typeof adminApp.name === 'string' && adminApp.options && adminApp.options.projectId) {
                        console.log(`[AdminServer] Firebase Admin App initialized successfully via ${credSource}. App Name: ${adminApp.name}, Project ID: ${adminApp.options.projectId}`);
                        adminAuth = admin.auth(adminApp);
                        adminDb = admin.firestore(adminApp);
                        console.log("[AdminServer] Firebase Admin Auth and Firestore services configured from the new app.");
                    } else {
                        const initFailureMsg = `[AdminServer] admin.initializeApp() call via ${credSource} did NOT return a valid app object or projectId is missing. App object: ${JSON.stringify(adminApp)}. This is a critical failure.`;
                        console.error(initFailureMsg);
                        adminInitializationError = new Error(initFailureMsg);
                        adminApp = undefined; // Ensure adminApp is undefined on failure
                        adminAuth = null;
                        adminDb = null;
                    }
                } catch (error: any) {
                    const criticalErrorMsg = `[AdminServer] CRITICAL: admin.initializeApp() call FAILED while attempting with ${credSource}.`;
                    console.error(criticalErrorMsg,
                        `Underlying Error Message: "${error.message}"`,
                        `Error Code: ${error.code || 'N/A'}`,
                        "Stack Trace (if available):", error.stack); // Log stack for more details
                    adminInitializationError = error; 
                    adminApp = undefined;
                    adminAuth = null;
                    adminDb = null;
                }
            } else {
                console.warn(`[AdminServer] Skipping admin.initializeApp() due to a prior credential processing error: ${adminInitializationError.message}`);
            }
        } else {
            adminApp = admin.apps[0]!; // Use the first initialized app
            if (adminApp && typeof adminApp.name === 'string' && adminApp.options && adminApp.options.projectId) {
               console.log(`[AdminServer] Firebase Admin SDK was already initialized. Using existing app: ${adminApp.name}, Project ID: ${adminApp.options.projectId}. Total apps: ${admin.apps.length}`);
               adminAuth = admin.auth(adminApp);
               adminDb = admin.firestore(adminApp);
               console.log("[AdminServer] Firebase Admin Auth and Firestore services configured from the existing app.");
            } else {
                const msg = `[AdminServer] admin.apps array is not empty, but the primary app instance seems invalid or is missing its projectId. App: ${JSON.stringify(adminApp)}. This is an unexpected state.`;
                console.error(msg);
                adminInitializationError = new Error(msg);
                adminApp = undefined;
                adminAuth = null;
                adminDb = null;
            }
        }
    }
} catch (e: any) {
    const importErrorMsg = `[AdminServer] CRITICAL: Failed during the import or initial processing of the 'firebase-admin' module itself. Error: ${e.message}`;
    console.error(importErrorMsg, e);
    adminInitializationError = new Error(importErrorMsg);
    admin = null; // Ensure admin module reference is null if import failed
    adminApp = undefined;
    adminAuth = null;
    adminDb = null;
}


if (adminInitializationError) {
    console.error(`[AdminServer] Final Status: Firebase Admin SDK initialization FAILED. Error: "${adminInitializationError.message}"`);
} else if (!adminApp || !adminDb || !adminAuth) {
    const finalErrorMsg = "[AdminServer] Final Status: Firebase Admin SDK initialization process completed, BUT one or more services (adminApp, adminDb, adminAuth) are NOT correctly set. This indicates an issue in the initialization logic flow.";
    console.error(finalErrorMsg);
    if (!adminInitializationError) adminInitializationError = new Error(finalErrorMsg); // Set a generic error if none was caught previously
} else {
    console.log(`[AdminServer] Final Status: Firebase Admin SDK initialized and services (App, Auth, Firestore) configured successfully.`);
}

export { adminAuth, adminDb, adminApp, adminInitializationError };

