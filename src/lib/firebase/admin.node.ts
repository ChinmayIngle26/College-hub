
// src/lib/firebase/admin.node.ts
// This file is INTENDED ONLY FOR NODE.JS RUNTIME ENVIRONMENTS.
// It should NOT be imported by any code path that might run in an Edge Runtime.
import * as admin from 'firebase-admin';
import type { app as AdminAppType, auth as AdminAuthType, firestore as AdminFirestoreType, credential as AdminCredentialType } from 'firebase-admin';

let adminApp: AdminAppType.App | undefined = undefined;
let adminAuth: AdminAuthType.Auth | null = null;
let adminDb: AdminFirestoreType.Firestore | null = null;
let adminInitializationError: Error | null = null;

const currentEnvInfoNode = `NODE_ONLY_ADMIN_SDK. NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`;

console.log(`[AdminNode] Initializing. ${currentEnvInfoNode}`);

if (typeof globalThis.EdgeRuntime === 'string') {
    const criticalEdgeImportError = "CRITICAL_ERROR: admin.node.ts was imported in an Edge Runtime. This file is only for Node.js. Check import paths.";
    console.error(`[AdminNode] ${criticalEdgeImportError}`);
    adminInitializationError = new Error(criticalEdgeImportError);
} else if (typeof admin.initializeApp !== 'function' || typeof admin.credential?.cert !== 'function') {
    const integrityErrorMsg = "[AdminNode] CRITICAL: Firebase Admin SDK module integrity check failed. 'admin.initializeApp' or 'admin.credential.cert' is not a function.";
    console.error(integrityErrorMsg);
    adminInitializationError = new Error(integrityErrorMsg);
} else {
    if (admin.apps.length === 0) {
        console.log("[AdminNode] No existing Firebase app. Proceeding with new initialization.");
        let credentials: AdminCredentialType.Credential | undefined = undefined;
        let credSource = "unknown";
        const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH; // Used by `require`
        const googleAppCredsEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Path used by default init

        try {
            if (serviceAccountJsonString) {
                credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON (env var string)";
                console.log(`[AdminNode] Attempting to use credentials from ${credSource}.`);
                try {
                    const serviceAccount = JSON.parse(serviceAccountJsonString);
                    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                        const validationError = new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is missing required fields (project_id, private_key, client_email).");
                        console.error(`[AdminNode] Validation Error for ${credSource}: ${validationError.message}`);
                        adminInitializationError = validationError; // Set error and prevent further init attempts with these creds
                    } else {
                        credentials = admin.credential.cert(serviceAccount);
                        console.log(`[AdminNode] Successfully parsed credentials from ${credSource}. Project ID from JSON: ${serviceAccount.project_id}`);
                    }
                } catch (e: any) {
                    const parseErrorMsg = `[AdminNode] ${credSource} parsing failed. Error: ${e.message}.`;
                    console.error(parseErrorMsg, e);
                    adminInitializationError = new Error(parseErrorMsg);
                }
            } else {
                console.log("[AdminNode] GOOGLE_APPLICATION_CREDENTIALS_JSON is NOT set.");
            }

            if (!credentials && serviceAccountPath && !adminInitializationError) {
                credSource = `FIREBASE_ADMIN_SDK_PATH (env var path: ${serviceAccountPath})`;
                console.log(`[AdminNode] Attempting to use credentials from ${credSource}.`);
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const serviceAccountModule = require(serviceAccountPath); // Using require for JSON path
                     if (!serviceAccountModule.project_id || !serviceAccountModule.private_key || !serviceAccountModule.client_email) {
                        const validationError = new Error("Service account from FIREBASE_ADMIN_SDK_PATH is missing required fields (project_id, private_key, client_email).");
                        console.error(`[AdminNode] Validation Error for ${credSource}: ${validationError.message}`);
                        adminInitializationError = validationError;
                    } else {
                        credentials = admin.credential.cert(serviceAccountModule);
                        console.log(`[AdminNode] Successfully loaded credentials from ${credSource}. Project ID from file: ${serviceAccountModule.project_id}`);
                    }
                } catch (e: any) {
                    const pathErrorMsg = `[AdminNode] Failed to load service account from ${credSource}. Error: ${e.message}.`;
                    console.error(pathErrorMsg, e);
                    adminInitializationError = new Error(pathErrorMsg);
                }
            }

            if (!adminInitializationError) { // Check if any credential loading step set an error
                if (credentials) {
                    console.log(`[AdminNode] About to call admin.initializeApp with EXPLICIT credentials from: ${credSource}.`);
                    adminApp = admin.initializeApp({ credential: credentials }, `admin-node-app-explicit-${Date.now()}`);
                    console.log(`[AdminNode] Successfully initialized with explicit credentials. App name: ${adminApp.name}`);
                } else {
                    credSource = `DEFAULT (e.g., GOOGLE_APPLICATION_CREDENTIALS env var pointing to a file path: ${googleAppCredsEnvVar || 'not set'}, or managed environment)`;
                    console.log(`[AdminNode] No explicit credentials were successfully loaded. Attempting DEFAULT initialization (will use ${credSource}).`);
                    adminApp = admin.initializeApp(undefined, `admin-node-app-default-${Date.now()}`);
                    console.log(`[AdminNode] Successfully initialized with default method. App name: ${adminApp.name}`);
                }
            } else {
                 console.warn(`[AdminNode] Skipping admin.initializeApp due to prior credential loading error: ${adminInitializationError.message}`);
            }
        } catch (error: any) {
            const criticalErrorMsg = "[AdminNode] CRITICAL: Firebase Admin SDK failed to initialize during admin.initializeApp call.";
            // Log the full error object for more details if `error.stack` is not enough
            console.error(criticalErrorMsg, "Error Message:", error.message, "Error Code:", error.code, "Error Stack:", error.stack, "Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            adminInitializationError = error;
        }
    } else {
        // Determine if our app was the one initialized, or use the default one
        adminApp = admin.apps.find(app => app?.name?.startsWith('admin-node-app')) || admin.app();
        console.log(`[AdminNode] Firebase Admin SDK already initialized or an app exists. Using app: ${adminApp.name}. Total apps: ${admin.apps.length}`);
         // If our app was initialized, adminInitializationError would be null from its perspective.
         // If it's not null here, it must have been set by a *previous* failed attempt in another HMR cycle.
         // This path is tricky. Let's assume if admin.apps.length > 0, we reset adminInitializationError UNLESS the found app itself has issues.
         // For now, if an app exists, assume it's usable.
        adminInitializationError = null; // Reset if apps exist, assuming one is usable.
    }

    if (adminApp && !adminInitializationError) {
        try {
            adminAuth = admin.auth(adminApp);
            adminDb = admin.firestore(adminApp);
            console.log("[AdminNode] Auth and Firestore services configured from app:", adminApp.name);
        } catch (serviceError: any) {
            console.error(`[AdminNode] Error configuring Auth/Firestore services from app ${adminApp.name}: ${serviceError.message}`);
            adminInitializationError = serviceError;
        }
    } else if (adminInitializationError) {
        console.error(`[AdminNode] Final status - SDK NOT INITIALIZED or services not configured. Error captured: ${adminInitializationError.message}`);
    } else if (!adminApp) {
        const indeterminateMsg = "[AdminNode] Final status - SDK state indeterminate (no app, no explicit error after init block).";
        console.warn(indeterminateMsg);
        adminInitializationError = new Error(indeterminateMsg);
    }
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
