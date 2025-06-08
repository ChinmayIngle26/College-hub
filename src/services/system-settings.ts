
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
 * Uses Firebase Admin SDK when on the server, and Client SDK when on the client.
 * Dynamically imports SDKs to avoid premature initialization in wrong environments.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const onServer = typeof window === 'undefined';
  const callContext = onServer ? 'server/middleware/generateMetadata' : 'client';

  if (onServer) {
    // Server-side: Use Firebase Admin SDK
    try {
      const { adminDb, adminApp } = await import('@/lib/firebase/admin');
      const { Timestamp: AdminTimestamp, FieldValue: AdminFieldValue } = await import('firebase-admin/firestore');

      if (!adminApp) {
        console.warn(`[${callContext}] Firebase Admin App is not initialized. Returning default system settings.`);
        return { ...defaultSettings };
      }
      if (!adminDb) {
        console.warn(`[${callContext}] Firebase Admin DB instance is not available. Returning default system settings.`);
        return { ...defaultSettings };
      }

      const settingsAdminDocRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
      const docSnap = await settingsAdminDocRef.get();

      if (docSnap.exists) {
        const data = docSnap.data()!; // data() will not be undefined if exists() is true
        return {
          ...defaultSettings,
          ...data,
          lastUpdated: data.lastUpdated instanceof AdminTimestamp ? data.lastUpdated.toDate() : null,
        };
      } else {
        console.warn(`[${callContext}] No system settings document found (Admin). Initializing with default values.`);
        await settingsAdminDocRef.set({ ...defaultSettings, lastUpdated: AdminFieldValue.serverTimestamp() });
        return { ...defaultSettings, lastUpdated: null }; // Return defaults (lastUpdated will be set by server)
      }
    } catch (error) {
      console.error(`[${callContext}] Error fetching/initializing system settings (Admin). Error:`, error);
      return { ...defaultSettings }; // Fallback to defaults on error
    }
  } else {
    // Client-side: Use Firebase Client SDK (dynamically imported)
    try {
      const { db: clientDb } = await import('@/lib/firebase/client');
      const { doc: clientDocFn, getDoc: getClientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn, Timestamp: ClientTimestamp } = await import('firebase/firestore');

      if (!clientDb) {
        console.warn(`[${callContext}] Firestore Client DB instance is not available. Returning default system settings.`);
        return { ...defaultSettings };
      }
      const settingsClientDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getClientDocFn(settingsClientDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...defaultSettings,
          ...data,
          lastUpdated: data.lastUpdated instanceof ClientTimestamp ? data.lastUpdated.toDate() : null,
        };
      } else {
        console.warn(`[${callContext}] No system settings document found (Client). Initializing with default values.`);
        await setClientDocFn(settingsClientDocRef, { ...defaultSettings, lastUpdated: clientServerTimestampFn() });
        return { ...defaultSettings, lastUpdated: null }; // serverTimestamp will be applied
      }
    } catch (error) {
      console.error(`[${callContext}] Error fetching/initializing system settings (Client). Error:`, error);
      return { ...defaultSettings }; // Fallback to defaults on error
    }
  }
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
      lastUpdated: clientServerTimestampFn(),
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
