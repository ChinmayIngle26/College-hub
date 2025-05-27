
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
import { getSystemSettings } from '@/services/system-settings';

const inter = Inter({ // Initialize Inter font
  subsets: ['latin'],
  variable: '--font-sans', // Define CSS variable
});

// Default values for metadata
const DEFAULT_APP_NAME = 'College Hub';
const DEFAULT_APP_DESCRIPTION = 'Your comprehensive college dashboard for students.';

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  let appName = DEFAULT_APP_NAME;
  let appDescription = DEFAULT_APP_DESCRIPTION;

  try {
    const settings = await getSystemSettings();
    appName = settings.applicationName || DEFAULT_APP_NAME;
    appDescription = `Access your student information and services at ${settings.applicationName || 'the College Hub'}.`;
  } catch (error) {
    console.warn(
      `Warning: Failed to load system settings for metadata generation. Using default metadata. Error: ${error instanceof Error ? error.message : String(error)}`
    );
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
