
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

// Removed static metadata, will generate dynamically
// export const metadata: Metadata = {
// title: 'Advanced Student ERP Dashboard', // This will be overridden
// description: 'Your college dashboard',
// };

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSystemSettings();
    return {
      title: settings.applicationName || 'Student ERP Dashboard', // Fallback title
      description: `Access your student information and services at ${settings.applicationName || 'the college dashboard'}.`,
    };
  } catch (error) {
    console.error("Failed to load system settings for metadata:", error);
    return {
      title: 'Student ERP Dashboard', // Fallback title on error
      description: 'Your college dashboard.',
    };
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Although metadata is generated server-side,
  // we might want to update the document title on client-side navigation if settings change live,
  // or ensure it's set correctly from the start.
  // However, `generateMetadata` should handle the initial title for server components.

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
