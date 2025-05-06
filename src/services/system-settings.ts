
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
  applicationName: 'College Hub', // Updated default name
  announcementTitle: 'Welcome to College Hub!', // Updated default title
  announcementContent: 'Stay tuned for important updates and announcements. You can customize this message in the admin settings.', // Updated default content
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
  if (!db) {
    console.warn("Firestore DB instance is not available. Returning default system settings. This might occur during build or if Firebase is not initialized.");
    return { ...defaultSettings }; // Return a copy
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Merge fetched data with defaults to ensure all keys are present
      return {
        ...defaultSettings, // Start with defaults
        ...data, // Override with fetched data
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated : null, // Ensure lastUpdated is a Timestamp or null
      } as SystemSettings;
    } else {
      console.log("No system settings document found in Firestore. Attempting to initialize with defaults.");
      try {
        await setDoc(settingsDocRef, {
          ...defaultSettings,
          lastUpdated: serverTimestamp(), // Use server timestamp for creation
        });
        console.log("System settings initialized successfully in Firestore with default values.");
        return { ...defaultSettings, lastUpdated: null }; // Return defaults (lastUpdated will be set by server)
      } catch (initError) {
        console.error("Failed to initialize system settings in Firestore. Returning default settings. Error:", initError);
        return { ...defaultSettings }; // Return default settings if initialization fails
      }
    }
  } catch (error) {
    console.error("Error fetching system settings from Firestore. Returning default settings. This might be due to Firestore rules or connectivity. Error:", error);
    // Return default settings on any other error to allow app to continue (e.g., for metadata)
    return { ...defaultSettings };
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
  if (!db) {
    console.error("Firestore DB instance is not available for updating system settings.");
    throw new Error("Database connection error while updating system settings.");
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const dataToUpdate = {
      ...settingsToUpdate,
      lastUpdated: serverTimestamp(),
    };
    // Use setDoc with merge: true to handle creation if document doesn't exist, or update if it does.
    // This is generally safer than updateDoc which fails if the doc doesn't exist.
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    console.log("System settings updated/created successfully.");
  } catch (error) {
    console.error("Error updating/creating system settings:", error);
    // Provide a more specific error message based on common Firestore error codes if possible
    if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            throw new Error("Permission denied when updating system settings. Ensure admin has correct Firestore permissions for 'systemSettings/appConfiguration'.");
        }
    }
    throw new Error("Failed to update system settings. Check Firestore rules and ensure admin privileges.");
  }
}
