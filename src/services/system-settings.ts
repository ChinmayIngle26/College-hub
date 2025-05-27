
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const SETTINGS_COLLECTION = 'systemSettings';
const SETTINGS_DOC_ID = 'appConfiguration'; // Singleton document for all app-wide settings

/**
 * Represents the structure of system-wide settings.
 */
export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean; 
  applicationName: string; 
  announcementTitle: string;
  announcementContent: string;
  defaultItemsPerPage: number; 
  lastUpdated?: Timestamp | null; 
  // Add other settings fields here as needed
  // e.g., defaultTheme?: 'light' | 'dark' | 'system';
}

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
 * Asynchronously retrieves the current system settings from Firestore.
 * If no settings document exists, it attempts to initialize default settings.
 * If Firestore is unavailable or an error occurs during fetch/initialization,
 * it logs a warning and returns a copy of the default settings to ensure the app can proceed.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const callContext = (typeof window === 'undefined') ? 'server/middleware' : 'client';

  if (!db) {
    console.warn(`[${callContext}] Firestore DB instance is not available. Returning default system settings. This might occur during build or if Firebase is not initialized, or due to Firestore rules.`);
    return { ...defaultSettings, lastUpdated: null }; // Return a copy
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // console.log(`[${callContext}] Fetched system settings from Firestore:`, data);
      // Merge fetched data with defaults to ensure all keys are present
      return {
        ...defaultSettings, // Start with defaults
        ...data, // Override with fetched data
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated : (data.lastUpdated?.toDate ? new Timestamp(data.lastUpdated.seconds, data.lastUpdated.nanoseconds) : null), // Ensure lastUpdated is a Timestamp or null
      } as SystemSettings;
    } else {
      console.warn(`[${callContext}] No system settings document found in Firestore (path: ${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}). Attempting to initialize with defaults.`);
      try {
        await setDoc(settingsDocRef, {
          ...defaultSettings,
          lastUpdated: serverTimestamp(), // Use server timestamp for creation
        });
        console.log(`[${callContext}] System settings initialized successfully in Firestore with default values.`);
        return { ...defaultSettings, lastUpdated: null }; // Return defaults (lastUpdated will be set by server)
      } catch (initError) {
        console.error(`[${callContext}] Failed to initialize system settings in Firestore. Returning default settings. Error:`, initError);
        return { ...defaultSettings, lastUpdated: null }; // Return default settings if initialization fails
      }
    }
  } catch (error) {
    console.error(`[${callContext}] Error fetching/processing system settings from Firestore (path: ${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}). Returning default settings. This might be due to Firestore rules or connectivity. Error:`, error);
    // Return default settings on any other error to allow app to continue (e.g., for metadata)
    return { ...defaultSettings, lastUpdated: null };
  }
}

/**
 * Asynchronously updates specified system settings in Firestore.
 *
 * @param settingsToUpdate A partial SystemSettings object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error during update.
 */
export async function updateSystemSettings(settingsToUpdate: Partial<SystemSettings>): Promise<void> {
  const callContext = (typeof window === 'undefined') ? 'server/middleware' : 'client';
  if (!db) {
    console.error(`[${callContext}] Firestore DB instance is not available for updating system settings.`);
    throw new Error("Database connection error while updating system settings.");
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const dataToUpdate = {
      ...settingsToUpdate,
      lastUpdated: serverTimestamp(),
    };
    // Use setDoc with merge: true to handle creation if document doesn't exist, or update if it does.
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    // console.log(`[${callContext}] System settings updated/created successfully with:`, dataToUpdate);
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
