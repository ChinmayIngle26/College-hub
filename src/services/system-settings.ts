
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const SETTINGS_COLLECTION = 'systemSettings';
const SETTINGS_DOC_ID = 'appConfiguration'; // Singleton document for all app-wide settings

/**
 * Represents the structure of system-wide settings.
 */
export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean; // New setting
  applicationName: string; // New setting
  defaultItemsPerPage: number; // New setting
  lastUpdated?: Timestamp; // Firestore Timestamp for server-side updates
  // Add other settings fields here as needed
  // e.g., defaultTheme?: 'light' | 'dark' | 'system';
}

/**
 * Asynchronously retrieves the current system settings from Firestore.
 * If no settings document exists, it initializes default settings.
 *
 * @returns A promise that resolves to a SystemSettings object.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error during fetch/init.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (!db) {
    console.error("Firestore DB instance is not available for system settings.");
    throw new Error("Database connection error while fetching system settings.");
  }

  const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      // Ensure all fields are present, falling back to defaults if some are missing
      // This is important for when new settings are added to an existing deployment
      return {
        maintenanceMode: data.maintenanceMode === undefined ? false : data.maintenanceMode,
        allowNewUserRegistration: data.allowNewUserRegistration === undefined ? true : data.allowNewUserRegistration,
        applicationName: data.applicationName === undefined ? 'Student ERP Dashboard' : data.applicationName,
        defaultItemsPerPage: data.defaultItemsPerPage === undefined ? 10 : data.defaultItemsPerPage,
        lastUpdated: data.lastUpdated,
      };
    } else {
      // Settings document doesn't exist, initialize with defaults
      console.log("No system settings document found. Initializing with defaults.");
      const defaultSettings: SystemSettings = {
        maintenanceMode: false,
        allowNewUserRegistration: true,
        applicationName: 'Student ERP Dashboard',
        defaultItemsPerPage: 10,
        lastUpdated: serverTimestamp() as Timestamp, // Firestore will convert this
      };
      await setDoc(settingsDocRef, defaultSettings);
      // Fetch again to get server-generated timestamp if needed, or return defaultSettings directly
      // For simplicity, returning defaultSettings. The `lastUpdated` will be set by server.
      // If you need the actual server timestamp immediately, you'd refetch or handle differently.
      return { ...defaultSettings, lastUpdated: undefined }; // lastUpdated will be set but not in this immediate return
    }
  } catch (error) {
    console.error("Error fetching or initializing system settings:", error);
    throw new Error("Failed to retrieve or initialize system settings.");
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
    // Ensure lastUpdated field is always set with server timestamp on any update
    const dataToUpdate = {
      ...settingsToUpdate,
      lastUpdated: serverTimestamp(),
    };
    // Use updateDoc to only change specified fields, or setDoc with merge if you prefer
    await updateDoc(settingsDocRef, dataToUpdate);
    console.log("System settings updated successfully.");
  } catch (error) {
    console.error("Error updating system settings:", error);
    // Check if the document might not exist (e.g., if getSystemSettings wasn't called first)
    if ((error as any).code === 'not-found') {
        console.log("Settings document not found for update, attempting to create it.");
        try {
            // Attempt to create the document with the new settings
            // This assumes settingsToUpdate contains all necessary fields for a new doc or defaults are fine.
            const fullSettingsOnCreate: SystemSettings = {
                maintenanceMode: false, // Default
                allowNewUserRegistration: true, // Default
                applicationName: 'Student ERP Dashboard', // Default
                defaultItemsPerPage: 10, // Default
                ...settingsToUpdate, // User provided settings override defaults
                lastUpdated: serverTimestamp() as Timestamp,
            };
            await setDoc(settingsDocRef, fullSettingsOnCreate);
            console.log("System settings document created and updated successfully.");
            return;
        } catch (createError) {
            console.error("Error creating system settings document during update attempt:", createError);
            throw new Error("Failed to update system settings (create attempt failed).");
        }
    }
    throw new Error("Failed to update system settings.");
  }
}

