import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider

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
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              {/* Main content area will include its own header */}
              <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider> {/* Close AuthProvider */}
      </body>
    </html>
  );
}
