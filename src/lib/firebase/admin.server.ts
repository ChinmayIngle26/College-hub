
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
        console.log("[AdminServer] No existing Firebase admin app. Proceeding with new initialization.");
        let credentials: AdminCredentialType.Credential | undefined = undefined;
        let credSource = "unknown";
        const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        // Attempt 1: GOOGLE_APPLICATION_CREDENTIALS_JSON (environment variable string)
        if (serviceAccountJsonString) {
            credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON (env var string)";
            console.log(`[AdminServer] Attempting to use credentials from ${credSource}.`);
            try {
                const serviceAccount = JSON.parse(serviceAccountJsonString);
                 if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                    const validationError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is missing required fields (project_id, private_key, client_email).");
                    console.error(`[AdminServer] Validation Error for ${credSource}: ${validationError.message}`);
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
        }

        // Core Initialization Logic
        try {
             if (!adminInitializationError) { // Only proceed if credential loading didn't set an error
                const appName = `admin-server-app-${credentials ? 'explicit' : 'default'}`;
                if (credentials) {
                    console.log(`[AdminServer] About to call admin.initializeApp with EXPLICIT credentials from: ${credSource}. AppName: ${appName}`);
                    adminApp = admin.initializeApp({ credential: credentials }, appName);
                } else {
                    // Attempt Application Default Credentials
                    credSource = `DEFAULT (Application Default Credentials - e.g., GOOGLE_APPLICATION_CREDENTIALS env var pointing to a file path, or managed environment)`;
                    console.log(`[AdminServer] Attempting DEFAULT initialization (ADC). Source: ${credSource}. AppName: ${appName}`);
                    adminApp = admin.initializeApp(undefined, appName);
                }

                if (adminApp && typeof adminApp.name === 'string' && adminApp.options?.projectId) {
                    console.log(`[AdminServer] Successfully initialized. App name: ${adminApp.name}, Project ID: ${adminApp.options.projectId}`);
                } else {
                    const initFailureMsg = `[AdminServer] admin.initializeApp call did NOT return a valid app object, failed silently, or project ID is missing. App: ${JSON.stringify(adminApp)}. Source: ${credSource}.`;
                    console.error(initFailureMsg);
                    adminInitializationError = new Error(initFailureMsg);
                }
            } else {
                 console.warn(`[AdminServer] Skipping admin.initializeApp due to prior credential loading error: ${adminInitializationError.message}`);
            }
        } catch (error: any) {
            const criticalErrorMsg = "[AdminServer] CRITICAL: Firebase Admin SDK's admin.initializeApp() call ITSELF FAILED.";
            console.error(criticalErrorMsg,
                `Credential Source Attempted: ${credSource}`,
                `Underlying Error Message: "${error.message}"`,
                `Error Code: ${error.code || 'N/A'}`,
                "Stack Trace:", error.stack
            );
            adminInitializationError = error;
        }
    } else {
        const existingApp = admin.apps.find(app => app?.name?.startsWith('admin-server-app')) || admin.apps[0];
        if (existingApp && typeof existingApp.name === 'string' && existingApp.options?.projectId) {
            adminApp = existingApp;
            console.log(`[AdminServer] Firebase Admin SDK already initialized. Using existing app: ${adminApp.name}, Project ID: ${adminApp.options.projectId}. Total apps: ${admin.apps.length}`);
        } else {
            const msg = `[AdminServer] admin.apps array is not empty, but no suitable app found or app is invalid (no name/projectId). Existing apps: ${admin.apps.map(a=>a?.name).join(', ')}. This is unexpected.`;
            console.error(msg);
            adminInitializationError = new Error(msg);
        }
    }

    if (adminApp && !adminInitializationError) {
        try {
            adminAuth = admin.auth(adminApp);
            adminDb = admin.firestore(adminApp);
            console.log("[AdminServer] Firebase Auth and Firestore services configured from app:", adminApp.name);
        } catch (serviceError: any) {
            console.error(`[AdminServer] Error configuring Auth/Firestore services from app ${adminApp.name}: ${serviceError.message}`, serviceError);
            adminInitializationError = serviceError; // Set error if service configuration fails
        }
    } else {
         if (adminInitializationError) {
            console.error(`[AdminServer] Final status: SDK NOT INITIALIZED or services not configured due to an earlier error: "${adminInitializationError.message}"`);
        } else {
            console.error(`[AdminServer] Final status: SDK NOT INITIALIZED (adminApp is undefined or invalid) and no specific error was caught previously. This indicates a logic flow issue.`);
            if(!adminInitializationError) adminInitializationError = new Error("Unknown error during Admin SDK initialization or service configuration.");
        }
    }
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
