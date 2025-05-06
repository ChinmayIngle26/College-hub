
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
// Removed Sidebar import as it's moved to the app-specific layout
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import { ThemeProvider } from '@/context/theme-provider'; // Import ThemeProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Advanced Student ERP Dashboard',
  description: 'Your college dashboard',
};

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
        <AuthProvider> {/* Wrap with AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Removed the main layout div structure and Sidebar */}
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider> {/* Close AuthProvider */}
      </body>
    </html>
  );
}

