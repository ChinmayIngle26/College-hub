
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
  applicationName: 'Student ERP Dashboard',
  announcementTitle: 'Welcome!',
  announcementContent: 'This is a default announcement. Please update it in the admin settings.',
  defaultItemsPerPage: 10,
  lastUpdated: null, 
};

/**
 * Asynchronously retrieves the current system settings from Firestore.
 * If no settings document exists, it initializes default settings.
 * If Firestore is unavailable or an error occurs, it returns default settings.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (!db) {
    console.warn("Firestore DB instance is not available. Returning default system settings.");
    return { ...defaultSettings }; // Return a copy to avoid accidental modification
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      return { // Ensure all fields are present, falling back to defaults
        maintenanceMode: data.maintenanceMode === undefined ? defaultSettings.maintenanceMode : data.maintenanceMode,
        allowNewUserRegistration: data.allowNewUserRegistration === undefined ? defaultSettings.allowNewUserRegistration : data.allowNewUserRegistration,
        applicationName: data.applicationName === undefined ? defaultSettings.applicationName : data.applicationName,
        announcementTitle: data.announcementTitle === undefined ? defaultSettings.announcementTitle : data.announcementTitle,
        announcementContent: data.announcementContent === undefined ? defaultSettings.announcementContent : data.announcementContent,
        defaultItemsPerPage: data.defaultItemsPerPage === undefined ? defaultSettings.defaultItemsPerPage : data.defaultItemsPerPage,
        lastUpdated: data.lastUpdated || null,
      };
    } else {
      console.log("No system settings document found. Initializing with defaults.");
      // Attempt to initialize, but don't let this block returning defaults if it fails
      try {
        await setDoc(settingsDocRef, {
          ...defaultSettings,
          lastUpdated: serverTimestamp(),
        });
      } catch (initError) {
        console.error("Failed to initialize system settings in Firestore:", initError);
        // Fall through to return defaultSettings
      }
      return { ...defaultSettings }; // Return a copy
    }
  } catch (error) {
    console.error("Error fetching or initializing system settings:", error);
    // Return default settings on any error to allow app to continue (e.g., for metadata)
    return { ...defaultSettings }; // Return a copy
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
    await updateDoc(settingsDocRef, dataToUpdate);
    console.log("System settings updated successfully.");
  } catch (error) {
    console.error("Error updating system settings:", error);
    // Check if the document might not exist
    if ((error as any).code === 'not-found' || (error as any).message?.includes('No document to update')) {
        console.log("Settings document not found for update, attempting to create it with provided and default values.");
        try {
            await setDoc(settingsDocRef, {
                ...defaultSettings, // Start with defaults
                ...settingsToUpdate, // Override with user-provided settings
                lastUpdated: serverTimestamp(),
            });
            console.log("System settings document created and updated successfully.");
            return; // Successfully created and updated
        } catch (createError) {
            console.error("Error creating system settings document during update attempt:", createError);
            throw new Error("Failed to update system settings (create attempt failed). Ensure Firestore rules allow creating 'systemSettings/appConfiguration' for admins.");
        }
    }
    // For other errors, throw a generic message
    throw new Error("Failed to update system settings. Ensure Firestore rules allow writing to 'systemSettings/appConfiguration' for admins.");
  }
}

