
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Users,
  Settings,
  LogOut,
  Edit, 
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const adminNavigationItems = [
  { href: '/', label: 'Student View', icon: Home }, // Changed label to clarify
  { href: '/admin', label: 'User Management', icon: Users },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
  { href: '/admin/requests', label: 'Change Requests', icon: Edit },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCollapsedState = localStorage.getItem('admin-sidebar-collapsed');
      if (storedCollapsedState) {
        setIsSidebarCollapsed(JSON.parse(storedCollapsedState));
      }
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };


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

  if (loading && isSidebarCollapsed === undefined) {
    return (
      <div className="flex h-screen">
        <aside className={cn(
            "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}>
          <div>
            <div className={cn("flex items-center mb-10", isSidebarCollapsed ? "justify-center" : "space-x-3")}>
              <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              )}
            </div>
            <nav className="space-y-2">
              {adminNavigationItems.map((_, i) => (
                <div key={i} className={cn("h-10 bg-muted rounded-md animate-pulse", isSidebarCollapsed ? "w-10 mx-auto" : "w-full")}></div>
              ))}
            </nav>
          </div>
          <div className={cn("h-10 bg-muted rounded-md animate-pulse", isSidebarCollapsed ? "w-10 mx-auto" : "w-full")}></div>
        </aside>
        <main className="flex-1 overflow-auto bg-background p-6">
            <div className="h-full w-full bg-muted rounded-md animate-pulse"></div>
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
    <div className="flex h-screen">
      <aside className={cn(
        "bg-sidebar-background h-screen p-4 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20 items-center" : "w-64"
      )}>
        <div>
          <div className={cn("flex items-center mb-10", isSidebarCollapsed ? "justify-center pt-2" : "space-x-3")}>
            <Image
              src="/placeholder-logo.svg"
              alt="AISSMS Admin Logo"
              width={isCollapsed ? 32 : 40}
              height={isCollapsed ? 32 : 40}
              className={cn(isSidebarCollapsed ? "h-8 w-8" : "h-10 w-10")}
              data-ai-hint="college crest logo"
            />
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-sm font-semibold text-sidebar-foreground">AISSMS</h1>
                <p className="text-xs text-sidebar-foreground/80">Admin Panel</p>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {adminNavigationItems.map((item) => {
              const isActive = (item.href === '/admin' && pathname.startsWith('/admin')) || pathname === item.href;
              // Special case for Home to not be active if on /admin/*
              const finalIsActive = item.href === '/' ? pathname === '/' : isActive;

              return (
                 <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                        <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isSidebarCollapsed ? "justify-center" : "",
                            finalIsActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                        >
                        <item.icon className={cn('w-5 h-5 shrink-0', finalIsActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-primary')} />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    </TooltipTrigger>
                    {isSidebarCollapsed && (
                    <TooltipContent side="right" className="bg-background text-foreground border-border">
                        <p>{item.label}</p>
                    </TooltipContent>
                    )}
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2 flex flex-col items-center">
            <div className={cn(isSidebarCollapsed ? "w-full flex justify-center" : "")}>
                <ThemeToggle />
            </div>
           {user ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}
                    >
                        <LogOut className="w-5 h-5 text-sidebar-primary shrink-0" />
                        {!isSidebarCollapsed && <span>Logout</span>}
                    </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                <TooltipContent side="right" className="bg-background text-foreground border-border">
                    <p>Logout</p>
                </TooltipContent>
                )}
            </Tooltip>
           ) : (
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/signin')}
                        className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}
                        >
                        <Home className="w-5 h-5 text-sidebar-primary shrink-0" /> 
                        {!isSidebarCollapsed && <span>Sign In</span>}
                    </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                <TooltipContent side="right" className="bg-background text-foreground border-border">
                    <p>Sign In</p>
                </TooltipContent>
                )}
            </Tooltip>
           )}
            <Button
                variant="ghost"
                onClick={toggleSidebarCollapse}
                className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    isSidebarCollapsed ? "justify-center" : ""
                )}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5 text-sidebar-primary shrink-0" /> : <ChevronsLeft className="w-5 h-5 text-sidebar-primary shrink-0" />}
                {!isSidebarCollapsed && <span>Collapse</span>}
            </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-6">
        {children}
      </main>
    </div>
    </TooltipProvider>
  );
}
