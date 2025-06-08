
// src/lib/firebase/admin.node.ts
// This file is INTENDED ONLY FOR NODE.JS RUNTIME ENVIRONMENTS.
// It should NOT be imported by any code path that might run in an Edge Runtime.
import * as admin from 'firebase-admin';
import type { app as AdminAppType, auth as AdminAuthType, firestore as AdminFirestoreType } from 'firebase-admin';

let adminApp: AdminAppType.App | undefined = undefined;
let adminAuth: AdminAuthType.Auth | null = null;
let adminDb: AdminFirestoreType.Firestore | null = null;
let adminInitializationError: Error | null = null;

const currentEnvInfoNode = `NODE_ONLY_ADMIN_SDK. NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`;

console.log(`Firebase Admin (Node.js): Preparing to initialize. ${currentEnvInfoNode}`);

if (typeof globalThis.EdgeRuntime === 'string') {
    const criticalEdgeImportError = "CRITICAL_ERROR: admin.node.ts was imported in an Edge Runtime. This file is only for Node.js. Check import paths.";
    console.error(criticalEdgeImportError);
    adminInitializationError = new Error(criticalEdgeImportError);
} else if (typeof admin.initializeApp !== 'function' || typeof admin.credential?.cert !== 'function') {
    const integrityErrorMsg = "CRITICAL: Firebase Admin SDK module integrity check failed in admin.node.ts. 'admin.initializeApp' or 'admin.credential.cert' is not a function.";
    console.error(integrityErrorMsg);
    adminInitializationError = new Error(integrityErrorMsg);
} else {
    if (admin.apps.length === 0) {
        console.log("Firebase Admin (Node.js): No existing app. Proceeding with new initialization.");
        let credentials;
        let credSource = "unknown";
        const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;

        try {
            if (serviceAccountJsonString) {
                console.log("Firebase Admin (Node.js): GOOGLE_APPLICATION_CREDENTIALS_JSON is set.");
                try {
                    const serviceAccount = JSON.parse(serviceAccountJsonString);
                    credentials = admin.credential.cert(serviceAccount);
                    credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
                    console.log(`Firebase Admin (Node.js): Successfully parsed credentials from ${credSource}.`);
                } catch (e: any) {
                    const parseErrorMsg = `Firebase Admin (Node.js): GOOGLE_APPLICATION_CREDENTIALS_JSON parsing failed. Error: ${e.message}.`;
                    console.error(parseErrorMsg, e);
                    adminInitializationError = new Error(parseErrorMsg);
                }
            } else {
                console.log("Firebase Admin (Node.js): GOOGLE_APPLICATION_CREDENTIALS_JSON is NOT set.");
            }

            if (!credentials && serviceAccountPath && !adminInitializationError) {
                console.log(`Firebase Admin (Node.js): Attempting to load service account from FIREBASE_ADMIN_SDK_PATH: '${serviceAccountPath}'.`);
                try {
                    const serviceAccountModule = require(serviceAccountPath);
                    credentials = admin.credential.cert(serviceAccountModule);
                    credSource = "FIREBASE_ADMIN_SDK_PATH";
                    console.log(`Firebase Admin (Node.js): Using credentials from ${credSource}.`);
                } catch (e: any) {
                    console.warn(`Firebase Admin (Node.js): Failed to load service account from FIREBASE_ADMIN_SDK_PATH ('${serviceAccountPath}'). Error: ${e.message}.`);
                }
            }

            if (!adminInitializationError) {
                if (credentials) {
                    adminApp = admin.initializeApp({ credential: credentials }, `admin-node-app-${Date.now()}`);
                    console.log(`Firebase Admin (Node.js): Successfully initialized with explicit credentials from ${credSource}. App name: ${adminApp.name}`);
                } else {
                    credSource = "default (e.g., GOOGLE_APPLICATION_CREDENTIALS env var for path, or managed environment)";
                    console.log(`Firebase Admin (Node.js): Attempting default initialization.`);
                    adminApp = admin.initializeApp(undefined, `admin-node-app-default-${Date.now()}`);
                    console.log(`Firebase Admin (Node.js): Successfully initialized with ${credSource}. App name: ${adminApp.name}`);
                }
            }
        } catch (error: any) {
            const criticalErrorMsg = "CRITICAL: Firebase Admin SDK failed to initialize during primary attempts (Node.js).";
            console.error(criticalErrorMsg, "Error:", error.message, "Code:", error.code, "Stack:", error.stack, error);
            adminInitializationError = error;
        }
    } else {
        // If using Next.js dev server, apps might persist across recompiles.
        // It's safer to get a named app or ensure you're getting the one you expect if multiple exist.
        // For simplicity, we'll try to get the default app if apps.length > 0.
        adminApp = admin.apps.find(app => app?.name?.includes('admin-node-app')) || admin.app();
        console.log(`Firebase Admin (Node.js): SDK already initialized or an app exists. Using app: ${adminApp.name}.`);
    }

    if (adminApp && !adminInitializationError) {
        adminAuth = admin.auth(adminApp);
        adminDb = admin.firestore(adminApp);
        console.log("Firebase Admin (Node.js): Auth and Firestore services configured.");
    } else if (adminInitializationError) {
        console.error(`Firebase Admin (Node.js): Final status - SDK NOT INITIALIZED. Error: ${adminInitializationError.message}`);
    } else if (!adminApp) {
        console.warn("Firebase Admin (Node.js): Final status - SDK state indeterminate (no app, no explicit error after init block).");
        adminInitializationError = new Error("Firebase Admin SDK indeterminate state after Node.js initialization attempt.");
    }
}

export { adminAuth, adminDb, adminApp, adminInitializationError };
