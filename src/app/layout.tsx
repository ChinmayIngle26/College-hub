import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for clean look
import './globals.css';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'College Hub',
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
        <Header />
        <main className="p-4 md:p-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
