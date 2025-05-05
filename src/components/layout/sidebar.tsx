'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  Vote,
  LogOut,
  School, // Using School icon as placeholder for college logo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { href: '/voting', label: 'Voting System', icon: Vote },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar p-4 shadow-md md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        {/* Placeholder Logo */}
        <div className="rounded-md bg-red-100 p-2">
          <School className="h-7 w-7 text-red-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sidebar-foreground">AISSMS</h2>
          <p className="text-xs text-muted-foreground">College of Engineering</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => (
          <Link href={item.href} key={item.label} legacyBehavior passHref>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                // Match base path segment for active state
                (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        // Add onClick handler for logout action
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
