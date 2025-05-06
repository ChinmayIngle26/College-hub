
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  User,
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  Vote,
  LogIn,
  LogOut,
  // School, // Replaced by Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { href: '/voting', label: 'Voting System', icon: Vote },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export function Sidebar() {
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
      <aside className="w-64 bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
            <div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <nav className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-md animate-pulse"></div>
            ))}
          </nav>
        </div>
        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-sidebar-background h-screen p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border">
      <div>
        <div className="flex items-center space-x-3 mb-10">
          <Image
            src="/placeholder-logo.svg"
            alt="AISSMS Logo"
            width={40}
            height={40}
            className="h-10 w-10"
            data-ai-hint="college crest logo"
          />
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">AISSMS</h1>
            <p className="text-xs text-sidebar-foreground/80">College of Engineering</p>
          </div>
        </div>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
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

      <div className="mt-auto">
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
            <LogIn className="w-5 h-5 text-sidebar-primary" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
