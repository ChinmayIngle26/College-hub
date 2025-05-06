
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

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  let appName = 'Student ERP Dashboard'; // Default fallback title
  let appDescription = 'Your college dashboard.'; // Default fallback description
  try {
    // This call might fail if Firestore rules are too restrictive or DB is down
    const settings = await getSystemSettings();
    appName = settings.applicationName || appName;
    appDescription = `Access your student information and services at ${settings.applicationName || 'the college dashboard'}.`;
  } catch (error) {
    console.error("Failed to load system settings for metadata, using defaults:", error);
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

