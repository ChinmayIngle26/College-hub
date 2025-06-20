
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; 
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
// Import directly from admin.server.ts for Node.js runtime
import { adminDb, adminInitializationError } from '@/lib/firebase/admin.server';
import type { SystemSettings } from '@/services/system-settings'; 

export const runtime = 'nodejs'; 

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans', 
});

const DEFAULT_APP_NAME = 'College Hub';
const DEFAULT_APP_DESCRIPTION = 'Your comprehensive college dashboard for students.';

export async function generateMetadata(): Promise<Metadata> {
  let appName = DEFAULT_APP_NAME;
  let appDescription = DEFAULT_APP_DESCRIPTION;

  console.log('[Layout:generateMetadata] Attempting to fetch settings using Admin SDK.');
  if (adminInitializationError) {
    console.warn(
      `[Layout:generateMetadata] Firebase Admin SDK (admin.server.ts) failed to initialize PRIOR to this check. Using default metadata. Error: ${adminInitializationError.message}`
    );
  } else if (!adminDb) {
    console.warn(
      `[Layout:generateMetadata] Firebase Admin DB (from admin.server.ts) is not available (is null). This likely means Admin SDK initialization failed or did not complete. Using default metadata.`
    );
  } else {
    try {
      console.log('[Layout:generateMetadata] AdminDb (from admin.server.ts) seems available, proceeding to fetch settings.');
      const settingsDocRef = adminDb.collection('systemSettings').doc('appConfiguration');
      const docSnap = await settingsDocRef.get();

      if (docSnap.exists) {
        const settings = docSnap.data() as SystemSettings;
        appName = settings.applicationName || DEFAULT_APP_NAME;
        console.log(`[Layout:generateMetadata] Fetched appName: ${appName} from Firestore (Admin SDK).`);
      } else {
        console.warn(`[Layout:generateMetadata] System settings document ('systemSettings/appConfiguration') not found in Firestore (Admin SDK). Using default app name.`);
      }
    } catch (error) {
      console.warn(
        `[Layout:generateMetadata] Error fetching system settings from Firestore (Admin SDK). Using default metadata. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  appDescription = `Access your student information and services at ${appName}.`;

  return {
    title: {
        default: appName,
        template: `%s | ${appName}` 
    },
    description: appDescription,
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased'
        )}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
