import type { StudentProfile } from '@/services/profile';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { User, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileCardProps {
  profile: StudentProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
         <Avatar className="h-12 w-12">
            {/* Add a placeholder image or use initials */}
            {/* <AvatarImage src="https://github.com/shadcn.png" alt={profile.name} /> */}
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div>
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription>Student ID: {profile.studentId}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 text-accent" />
          <span>Major: {profile.major}</span>
        </div>
      </CardContent>
    </Card>
  );
}
