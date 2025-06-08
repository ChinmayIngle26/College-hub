// src/services/system-settings.ts
export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean;
  applicationName: string;
  announcementTitle: string;
  announcementContent: string;
  defaultItemsPerPage: number;
  lastUpdated?: Date | null;
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
 * Conditionally imports Admin SDK wrappers based on runtime environment.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const onServer = typeof window === 'undefined';
  const isEdgeEnvironment = onServer && typeof globalThis.EdgeRuntime === 'string';
  const callContext = isEdgeEnvironment ? 'server-edge' : (onServer ? 'server-node' : 'client');

  // console.log(`[SystemSettings:${callContext}] getSystemSettings called.`);

  if (isEdgeEnvironment) {
    // console.log(`[SystemSettings:server-edge] In Edge Runtime. Importing from admin.edge.ts.`);
    // This path should NOT attempt to import 'firebase-admin' or 'admin.server.ts'
    try {
        const adminEdgeModule = await import('@/lib/firebase/admin.edge');
        if (adminEdgeModule.adminInitializationError) {
            // console.warn(`[SystemSettings:server-edge] Admin SDK (Edge Placeholder) status: ${adminEdgeModule.adminInitializationError.message}. Returning default system settings.`);
        }
    } catch (e) {
        console.error(`[SystemSettings:server-edge] CRITICAL: Failed to import admin.edge.ts. This should not happen. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    return { ...defaultSettings, lastUpdated: new Date() }; // Always return defaults from edge for now
  }

  if (onServer && !isEdgeEnvironment) { // Explicitly Node.js server environment
    // console.log(`[SystemSettings:server-node] Attempting to use Firebase Admin SDK via admin.server.ts.`);
    try {
      // Dynamically import the Node.js specific admin module
      const { adminDb, adminApp, adminInitializationError } = await import('@/lib/firebase/admin.server');
      const { Timestamp: AdminTimestamp, FieldValue: AdminFieldValue } = await import('firebase-admin/firestore');

      if (adminInitializationError) {
        console.error(`[SystemSettings:server-node] Firebase Admin SDK (admin.server.ts) initialization failed previously. Error: ${adminInitializationError.message}. Returning default system settings.`);
        return { ...defaultSettings };
      }
      if (!adminDb) {
        console.warn(`[SystemSettings:server-node] Firebase Admin DB (from admin.server.ts) is not available. Returning default system settings.`);
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
        return { ...defaultSettings, lastUpdated: new Date() };
      }
    } catch (error: any) {
      console.error(`[SystemSettings:server-node] Error fetching/initializing system settings (Admin via admin.server.ts). Error: ${error.message}. Stack: ${error.stack}. Returning default system settings.`);
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
        await setClientDocFn(settingsClientDocRef, { ...defaultSettings, lastUpdated: clientServerTimestampFn() });
        return { ...defaultSettings, lastUpdated: new Date() };
      }
    } catch (error: any) {
      console.error(`[SystemSettings:client] Error fetching/initializing system settings (Client). Error: ${error.message}. Stack: ${error.stack}. Returning default system settings.`);
      return { ...defaultSettings };
    }
  }

  console.warn(`[SystemSettings] Unhandled case for getSystemSettings (onServer: ${onServer}, isEdgeEnvironment: ${isEdgeEnvironment}). Returning default system settings.`);
  return { ...defaultSettings };
}

/**
 * Asynchronously updates specified system settings in Firestore using the Client SDK.
 * This function is intended to be called from client-side components (e.g., AdminSettingsPage).
 */
export async function updateSystemSettings(settingsToUpdate: Partial<SystemSettings>): Promise<void> {
  const { db: clientDb } = await import('@/lib/firebase/client');
  const { doc: clientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn } = await import('firebase/firestore');

  if (!clientDb) {
    console.error(`[SystemSettings:update] Firestore Client DB instance is not available.`);
    throw new Error("Database connection error while updating system settings.");
  }

  const settingsDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  try {
    const dataToUpdate = { ...settingsToUpdate, lastUpdated: clientServerTimestampFn() };
    await setClientDocFn(settingsDocRef, dataToUpdate, { merge: true });
  } catch (error) {
    console.error(`[SystemSettings:update] Error updating system settings (Client SDK):`, error);
     if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            throw new Error("Permission denied when updating system settings. Ensure admin has correct Firestore permissions for 'systemSettings/appConfiguration'.");
        }
    }
    throw new Error("Failed to update system settings.");
  }
}
