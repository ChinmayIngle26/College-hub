
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Settings,
  LogOut,
  // School, // Replaced by Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle'; // Import ThemeToggle

const adminNavigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/admin', label: 'User Management', icon: Users },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        deleteCookie('firebaseAuthToken');
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
        });
        router.push('/signin');
      } catch (error) {
        console.error('Logout failed:', error);
        toast({
          title: 'Logout Failed',
          description: 'Could not log you out. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      console.error('Firebase auth is not initialized');
      toast({
        title: 'Logout Failed',
        description: 'Authentication system is not properly initialized.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
     // Basic skeleton for sidebar loading state
    return (
      <div className="flex h-screen">
        <aside className="w-64 bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border">
          <div>
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
              <div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <nav className="space-y-2">
              {[...Array(3)].map((_, i) => ( // 3 items for admin
                <div key={i} className="h-10 bg-muted rounded-md animate-pulse"></div>
              ))}
            </nav>
          </div>
          <div className="h-10 bg-muted rounded-md animate-pulse"></div>
        </aside>
        <main className="flex-1 overflow-auto bg-background p-6">
             {/* Placeholder for main content loading */}
            <div className="h-full w-full bg-muted rounded-md animate-pulse"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-sidebar-background h-screen p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border">
        <div>
          <div className="flex items-center space-x-3 mb-10">
            <Image
              src="/placeholder-logo.svg" // Assuming same logo for admin
              alt="AISSMS Admin Logo"
              width={40}
              height={40}
              className="h-10 w-10"
              data-ai-hint="college crest logo"
            />
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">AISSMS</h1>
              <p className="text-xs text-sidebar-foreground/80">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {adminNavigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/admin' && pathname.startsWith('/admin/'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-primary')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2">
           <ThemeToggle /> {/* Add ThemeToggle to admin sidebar */}
          {user ? (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-5 h-5 text-sidebar-primary" />
            <span>Logout</span>
          </Button>
          ) : (
             <Button
              variant="ghost"
              onClick={() => router.push('/signin')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              {/* Using Home icon as a placeholder if LogIn icon is not suitable for this context */}
              <Home className="w-5 h-5 text-sidebar-primary" /> 
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-6">
        {children}
      </main>
    </div>
  );
}

