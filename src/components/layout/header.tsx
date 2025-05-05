import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="text-lg font-semibold">College Hub</span>
        </Link>
        {/* Add navigation or user menu here if needed in the future */}
      </div>
    </header>
  );
}
