
// REMOVE top-level client SDK imports to prevent server-side evaluation issues:
// import { doc, getDoc, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/client';

export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean;
  applicationName: string;
  announcementTitle: string;
  announcementContent: string;
  defaultItemsPerPage: number;
  lastUpdated?: Date | null; // Normalized to Date or null
}

const SETTINGS_COLLECTION = 'systemSettings';
const SETTINGS_DOC_ID = 'appConfiguration';

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  allowNewUserRegistration: true,
  applicationName: 'College Hub',
  announcementTitle: 'Welcome to College Hub!',
  announcementContent: 'Stay tuned for important updates and announcements. You can customize this message in the admin settings.',
  defaultItemsPerPage: 10,
  lastUpdated: null,
};

/**
 * Asynchronously retrieves the current system settings.
 * Uses Firebase Admin SDK when on the server (Node.js runtime), and Client SDK when on the client.
 * Skips Admin SDK usage if on the server but in Edge Runtime.
 * Dynamically imports SDKs to avoid premature initialization in wrong environments.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const onServer = typeof window === 'undefined';
  // More direct check for Vercel Edge Runtime or similar environments
  const isEdgeEnvironment = onServer && typeof globalThis.EdgeRuntime === 'string';
  const callContext = isEdgeEnvironment ? 'server-edge' : (onServer ? 'server-node' : 'client');

  // console.log(`[SystemSettings:${callContext}] getSystemSettings called. process.env.NEXT_RUNTIME: ${process.env.NEXT_RUNTIME}, globalThis.EdgeRuntime: ${typeof globalThis.EdgeRuntime}`);

  if (isEdgeEnvironment) {
    console.warn(`[SystemSettings:server-edge] Running in an Edge-like Runtime (globalThis.EdgeRuntime detected). Firebase Admin SDK will not be used. Returning default system settings.`);
    return { ...defaultSettings, lastUpdated: new Date() };
  }

  if (onServer && !isEdgeEnvironment) { // Explicitly Node.js server environment
    // Server-side (Node.js): Use Firebase Admin SDK
    // console.log(`[SystemSettings:server-node] Attempting to use Firebase Admin SDK.`);
    try {
      // Dynamically import Admin SDK parts only when needed in Node.js server environment
      const { adminDb, adminApp, adminInitializationError } = await import('@/lib/firebase/admin');
      const { Timestamp: AdminTimestamp, FieldValue: AdminFieldValue } = await import('firebase-admin/firestore');

      if (adminInitializationError) {
        console.error(`[SystemSettings:server-node] Firebase Admin SDK initialization failed previously. Error: ${adminInitializationError.message}. Returning default system settings.`);
        return { ...defaultSettings };
      }
      if (!adminApp) {
        console.warn(`[SystemSettings:server-node] Firebase Admin App is not available after import (should have been caught by adminInitializationError). Returning default system settings.`);
        return { ...defaultSettings };
      }
      if (!adminDb) {
        console.warn(`[SystemSettings:server-node] Firebase Admin DB is not available. Returning default system settings.`);
         return { ...defaultSettings };
      }


      const settingsAdminDocRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
      const docSnap = await settingsAdminDocRef.get();

      if (docSnap.exists) {
        const data = docSnap.data()!;
        // console.log(`[SystemSettings:server-node] Fetched settings from Firestore (Admin).`);
        return {
          ...defaultSettings,
          ...data,
          lastUpdated: data.lastUpdated instanceof AdminTimestamp ? data.lastUpdated.toDate() : (data.lastUpdated && typeof data.lastUpdated.toDate === 'function' ? data.lastUpdated.toDate() : null),
        };
      } else {
        console.warn(`[SystemSettings:server-node] No system settings document found (Admin). Initializing with default values.`);
        await settingsAdminDocRef.set({ ...defaultSettings, lastUpdated: AdminFieldValue.serverTimestamp() });
        return { ...defaultSettings, lastUpdated: new Date() }; // Represent current time for this initial set
      }
    } catch (error: any) {
      console.error(`[SystemSettings:server-node] Error fetching/initializing system settings (Admin). Error: ${error.message}. Stack: ${error.stack}. Returning default system settings.`);
      return { ...defaultSettings };
    }
  } else if (!onServer) {
    // Client-side: Use Firebase Client SDK
    // console.log(`[SystemSettings:client] Attempting to use Firebase Client SDK.`);
    try {
      const { db: clientDb } = await import('@/lib/firebase/client');
      const { doc: clientDocFn, getDoc: getClientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn, Timestamp: ClientTimestamp } = await import('firebase/firestore');

      if (!clientDb) {
        console.warn(`[SystemSettings:client] Firestore Client DB instance is not available. Returning default system settings.`);
        return { ...defaultSettings };
      }
      const settingsClientDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getClientDocFn(settingsClientDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // console.log(`[SystemSettings:client] Fetched settings from Firestore (Client).`);
        return {
          ...defaultSettings,
          ...data,
          lastUpdated: data.lastUpdated instanceof ClientTimestamp ? data.lastUpdated.toDate() : (data.lastUpdated && typeof data.lastUpdated.toDate === 'function' ? data.lastUpdated.toDate() : null),
        };
      } else {
        console.warn(`[SystemSettings:client] No system settings document found (Client). Initializing with default values.`);
        // Make sure clientServerTimestampFn is called to get the sentinel
        await setClientDocFn(settingsClientDocRef, { ...defaultSettings, lastUpdated: clientServerTimestampFn() });
        return { ...defaultSettings, lastUpdated: new Date() }; // Represent current time, actual value will be server timestamp
      }
    } catch (error: any) {
      console.error(`[SystemSettings:client] Error fetching/initializing system settings (Client). Error: ${error.message}. Stack: ${error.stack}. Returning default system settings.`);
      return { ...defaultSettings };
    }
  }
  
  // Fallback for any unexpected execution path
  console.warn(`[SystemSettings] Unhandled case for getSystemSettings (onServer: ${onServer}, isEdgeEnvironment: ${isEdgeEnvironment}). Returning default system settings.`);
  return { ...defaultSettings };
}

/**
 * Asynchronously updates specified system settings in Firestore using the Client SDK.
 * This function is intended to be called from client-side components.
 *
 * @param settingsToUpdate A partial SystemSettings object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error during update.
 */
export async function updateSystemSettings(settingsToUpdate: Partial<SystemSettings>): Promise<void> {
  // This function is called from client-side (AdminSettingsPage), so it should use client SDK.
  // Dynamically import client SDK parts.
  const { db: clientDb } = await import('@/lib/firebase/client');
  const { doc: clientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn } = await import('firebase/firestore');

  const callContext = 'client (updateSystemSettings)';

  if (!clientDb) {
    console.error(`[${callContext}] Firestore Client DB instance is not available for updating system settings.`);
    throw new Error("Database connection error while updating system settings.");
  }

  const settingsDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const dataToUpdate = {
      ...settingsToUpdate,
      lastUpdated: clientServerTimestampFn(), // Ensure this is the sentinel
    };
    // Use setDoc with merge: true to handle creation if document doesn't exist, or update if it does.
    await setClientDocFn(settingsDocRef, dataToUpdate, { merge: true });
  } catch (error) {
    console.error(`[${callContext}] Error updating/creating system settings (path: ${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}):`, error);
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            throw new Error("Permission denied when updating system settings. Ensure admin has correct Firestore permissions for 'systemSettings/appConfiguration'.");
        }
    }
    throw new Error("Failed to update system settings. Check Firestore rules and ensure admin privileges.");
  }
}
