
// src/lib/firebase/admin.server.ts
// This file is INTENDED ONLY FOR NODE.JS RUNTIME ENVIRONMENTS.
import * as admin from 'firebase-admin';
import type { app as AdminAppType, auth as AdminAuthType, firestore as AdminFirestoreType, credential as AdminCredentialType } from 'firebase-admin';

let adminApp: AdminAppType.App | undefined = undefined;
let adminAuth: AdminAuthType.Auth | null = null;
let adminDb: AdminFirestoreType.Firestore | null = null;
let adminInitializationError: Error | null = null;

const currentEnvInfoNode = `SERVER_ONLY_ADMIN_SDK. NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`;
console.log(`[AdminServer] Initializing. ${currentEnvInfoNode}`);

if (typeof globalThis.EdgeRuntime === 'string') {
    const criticalEdgeImportError = "CRITICAL_ERROR: admin.server.ts was imported in an Edge Runtime. This file is only for Node.js. Check import paths.";
    console.error(`[AdminServer] ${criticalEdgeImportError}`);
    adminInitializationError = new Error(criticalEdgeImportError);
} else if (typeof admin.initializeApp !== 'function') {
    const integrityErrorMsg = "[AdminServer] CRITICAL: Firebase Admin SDK module integrity check failed. 'admin.initializeApp' is not a function. 'firebase-admin' module might be corrupted or not loaded correctly.";
    console.error(integrityErrorMsg);
    adminInitializationError = new Error(integrityErrorMsg);
} else {
    if (admin.apps.length === 0) {
        console.log("[AdminServer] No existing Firebase admin app. Proceeding with new initialization attempt.");
        let credentials = null;
        let credSource = "unknown";
        const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (serviceAccountJsonString) {
            credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON (env var string)";
            console.log(`[AdminServer] Found ${credSource}. Attempting to parse.`);
            try {
                const serviceAccount = JSON.parse(serviceAccountJsonString);
                if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                    const validationError = new Error(`[AdminServer] ${credSource} is missing required fields (project_id, private_key, client_email).`);
                    console.error(validationError.message);
                    adminInitializationError = validationError;
                } else {
                    credentials = admin.credential.cert(serviceAccount);
                    console.log(`[AdminServer] Successfully parsed credentials from ${credSource}. Project ID from JSON: ${serviceAccount.project_id}`);
                }
            } catch (e: any) {
                const parseErrorMsg = `[AdminServer] ${credSource} parsing failed. Error: ${e.message}. Check if the JSON string is valid.`;
                console.error(parseErrorMsg, e);
                adminInitializationError = new Error(parseErrorMsg);
            }
        } else {
            console.log("[AdminServer] GOOGLE_APPLICATION_CREDENTIALS_JSON env var is NOT set. Will attempt Application Default Credentials (ADC).");
            credSource = "Application Default Credentials (ADC)";
        }

        if (!adminInitializationError) { // Only attempt to initialize if no prior credential error
            try {
                console.log(`[AdminServer] Attempting admin.initializeApp() using ${credSource}.`);
                if (credentials) {
                    adminApp = admin.initializeApp({ credential: credentials });
                } else {
                    // For ADC. If GOOGLE_APPLICATION_CREDENTIALS env var points to a file path, it's used.
                    // Otherwise, it checks for well-known ADC locations or managed environment credentials.
                    adminApp = admin.initializeApp();
                }

                if (adminApp && adminApp.options && adminApp.options.projectId) {
                    console.log(`[AdminServer] Firebase Admin App initialized successfully. App Name: ${adminApp.name}, Project ID: ${adminApp.options.projectId}. Source: ${credSource}`);
                    adminAuth = admin.auth(adminApp);
                    adminDb = admin.firestore(adminApp);
                    console.log("[AdminServer] Firebase Auth and Firestore services configured.");
                } else {
                    const initFailureMsg = `[AdminServer] admin.initializeApp() call did NOT return a valid app object or project ID is missing. App: ${JSON.stringify(adminApp)}. Source: ${credSource}. This is a critical failure.`;
                    console.error(initFailureMsg);
                    adminInitializationError = new Error(initFailureMsg);
                    adminApp = undefined; // Ensure adminApp is undefined on failure
                    adminAuth = null;
                    adminDb = null;
                }
            } catch (error: any) {
                const criticalErrorMsg = `[AdminServer] CRITICAL: admin.initializeApp() call FAILED using ${credSource}.`;
                console.error(criticalErrorMsg,
                    `Underlying Error Message: "${error.message}"`,
                    `Error Code: ${error.code || 'N/A'}`,
                    "Stack Trace:", error.stack);
                adminInitializationError = error;
                adminApp = undefined;
                adminAuth = null;
                adminDb = null;
            }
        } else {
            console.warn(`[AdminServer] Skipping admin.initializeApp() due to prior credential processing error: ${adminInitializationError.message}`);
        }

    } else {
        adminApp = admin.apps[0]!; // Use the first initialized app if available
        if (adminApp && adminApp.options && adminApp.options.projectId) {
           console.log(`[AdminServer] Firebase Admin SDK already initialized. Using existing app: ${adminApp.name}, Project ID: ${adminApp.options.projectId}. Total apps: ${admin.apps.length}`);
           try {
               adminAuth = admin.auth(adminApp);
               adminDb = admin.firestore(adminApp);
               console.log("[AdminServer] Firebase Auth and Firestore services configured from existing app.");
           } catch (serviceError: any) {
               console.error(`[AdminServer] Error configuring Auth/Firestore services from existing app ${adminApp.name}: ${serviceError.message}`, serviceError);
               adminInitializationError = serviceError;
               adminAuth = null;
               adminDb = null;
           }
        } else {
            const msg = `[AdminServer] admin.apps array is not empty, but the primary app is invalid or missing projectId. App: ${JSON.stringify(adminApp)}. This is unexpected.`;
            console.error(msg);
            adminInitializationError = new Error(msg);
            adminApp = undefined;
            adminAuth = null;
            adminDb = null;
        }
    }
}

if (adminInitializationError) {
    console.error(`[AdminServer] Final Status: Firebase Admin SDK initialization FAILED. Error: "${adminInitializationError.message}"`);
} else if (!adminApp || !adminDb) {
    console.error(`[AdminServer] Final Status: Firebase Admin SDK initialized BUT adminApp or adminDb is NOT correctly set. This should not happen.`);
    adminInitializationError = new Error("Firebase Admin SDK initialized but services are not available.");
} else {
    console.log(`[AdminServer] Final Status: Firebase Admin SDK initialized and services configured successfully.`);
}


export { adminAuth, adminDb, adminApp, adminInitializationError };
