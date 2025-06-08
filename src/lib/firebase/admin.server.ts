// src/lib/firebase/admin.server.ts
// This file is INTENDED ONLY FOR NODE.JS RUNTIME ENVIRONMENTS.
// It should NOT be imported by any code path that might run in an Edge Runtime.
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
} else if (typeof admin.initializeApp !== 'function' || typeof admin.credential?.cert !== 'function') {
    const integrityErrorMsg = "[AdminServer] CRITICAL: Firebase Admin SDK module integrity check failed. 'admin.initializeApp' or 'admin.credential.cert' is not a function. The 'firebase-admin' module might be corrupted or not loaded correctly.";
    console.error(integrityErrorMsg);
    adminInitializationError = new Error(integrityErrorMsg);
} else {
    if (admin.apps.length === 0) {
        console.log("[AdminServer] No existing Firebase admin app. Proceeding with new initialization.");
        let credentials: AdminCredentialType.Credential | undefined = undefined;
        let credSource = "unknown";
        const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
        const googleAppCredsEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Path used by default init

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
            console.log("[AdminServer] GOOGLE_APPLICATION_CREDENTIALS_JSON env var is NOT set.");
        }

        // Attempt 2: FIREBASE_ADMIN_SDK_PATH (environment variable file path)
        if (!credentials && serviceAccountPath && !adminInitializationError) {
            credSource = `FIREBASE_ADMIN_SDK_PATH (env var path: ${serviceAccountPath})`;
            console.log(`[AdminServer] Attempting to use credentials from ${credSource}.`);
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const serviceAccountModule = require(serviceAccountPath);
                if (!serviceAccountModule.project_id || !serviceAccountModule.private_key || !serviceAccountModule.client_email) {
                    const validationError = new Error("Service account from FIREBASE_ADMIN_SDK_PATH is missing required fields (project_id, private_key, client_email).");
                    console.error(`[AdminServer] Validation Error for ${credSource}: ${validationError.message}`);
                    adminInitializationError = validationError;
                } else {
                    credentials = admin.credential.cert(serviceAccountModule);
                    console.log(`[AdminServer] Successfully loaded credentials from ${credSource}. Project ID from file: ${serviceAccountModule.project_id}`);
                }
            } catch (e: any) {
                const pathErrorMsg = `[AdminServer] Failed to load service account from ${credSource}. Ensure the path is correct and accessible. Error: ${e.message}.`;
                console.error(pathErrorMsg, e);
                adminInitializationError = new Error(pathErrorMsg);
            }
        } else if (!credentials && !adminInitializationError) {
            console.log("[AdminServer] FIREBASE_ADMIN_SDK_PATH env var is NOT set or credentials already found/error occurred.");
        }

        // Core Initialization Logic
        try {
            if (!adminInitializationError) { // Only proceed if credential loading didn't set an error
                const appName = `admin-server-app-${credentials ? 'explicit' : 'default'}`;
                if (credentials) {
                    console.log(`[AdminServer] About to call admin.initializeApp with EXPLICIT credentials from: ${credSource}. AppName: ${appName}`);
                    adminApp = admin.initializeApp({ credential: credentials }, appName);
                    console.log(`[AdminServer] Successfully initialized with explicit credentials. App name: ${adminApp.name}`);
                } else {
                    credSource = `DEFAULT (Application Default Credentials - e.g., GOOGLE_APPLICATION_CREDENTIALS env var pointing to a file path: ${googleAppCredsEnvVar || 'not set'}, or managed environment)`;
                    console.log(`[AdminServer] No explicit credentials were successfully loaded or provided. Attempting DEFAULT initialization (ADC). Source: ${credSource}. AppName: ${appName}`);
                    adminApp = admin.initializeApp(undefined, appName); // Pass undefined for options to trigger ADC
                    console.log(`[AdminServer] Attempted initialization with default method (ADC). App name: ${adminApp?.name || 'UNKNOWN (init may have failed silently or returned undefined)'}`);
                }
            } else {
                 console.warn(`[AdminServer] Skipping admin.initializeApp due to prior credential loading error: ${adminInitializationError.message}`);
            }
        } catch (error: any) {
            const criticalErrorMsg = "[AdminServer] CRITICAL: Firebase Admin SDK's admin.initializeApp() call ITSELF FAILED.";
            console.error(criticalErrorMsg, 
                `Underlying Error Message: "${error.message}"`,
                `Error Code: ${error.code || 'N/A'}`,
                "Full Error Object (JSON):", JSON.stringify(error, Object.getOwnPropertyNames(error)), 
                "Stack Trace:", error.stack
            );
            adminInitializationError = error; // Capture the error from initializeApp
        }
    } else {
        const existingApp = admin.apps.find(app => app?.name?.startsWith('admin-server-app')) || admin.app();
        if (existingApp) {
            adminApp = existingApp;
            console.log(`[AdminServer] Firebase Admin SDK already initialized. Using existing app: ${adminApp.name}. Total apps: ${admin.apps.length}`);
            adminInitializationError = null; 
        } else {
            const msg = "[AdminServer] admin.apps array is not empty, but no suitable app found and admin.app() returned falsy. This is unexpected.";
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
            adminInitializationError = serviceError; 
        }
    } else if (adminInitializationError) {
        console.error(`[AdminServer] Final status: SDK NOT INITIALIZED or services not configured due to an earlier error. Captured error: "${adminInitializationError.message}"`);
    } else if (!adminApp) {
        const indeterminateMsg = "[AdminServer] Final status: SDK state indeterminate (no app instance, but no explicit error reported after initialization block). This implies a logic flaw or silent failure.";
        console.warn(indeterminateMsg);
        adminInitializationError = new Error(indeterminateMsg);
    }
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
