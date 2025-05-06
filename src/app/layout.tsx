
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
import { getSystemSettings } from '@/services/system-settings'; // Import for fetching settings

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Default values for metadata
const DEFAULT_APP_NAME = 'College Hub';
const DEFAULT_APP_DESCRIPTION = 'Your comprehensive college dashboard for students.';

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  let appName = DEFAULT_APP_NAME;
  let appDescription = DEFAULT_APP_DESCRIPTION;

  try {
    // This call runs on the server (during build or SSR).
    // Firestore rules MUST allow unauthenticated reads for 'systemSettings/appConfiguration'
    // if this function is to succeed without a logged-in user context.
    const settings = await getSystemSettings();
    appName = settings.applicationName || DEFAULT_APP_NAME; // Use fetched or default
    appDescription = `Access your student information and services at ${settings.applicationName || 'the College Hub'}.`;
  } catch (error) {
    // Log the error but do not re-throw. Allow the app to build/run with default metadata.
    // This is crucial for initial setup or if Firestore is temporarily unreachable.
    console.warn(
      `Warning: Failed to load system settings for metadata generation. Using default metadata. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    // Fallback to default values is already handled by initial appName/appDescription
  }
  return {
    title: appName,
    description: appDescription,
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
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

