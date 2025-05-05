import type { Announcement } from '@/services/announcements';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone } from 'lucide-react'; // Or another relevant icon

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  const sortedAnnouncements = announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow h-full"> {/* Make card take full height */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Recent Announcements
        </CardTitle>
        {/* Optional description */}
        {/* <CardDescription>Latest news and updates.</CardDescription> */}
      </CardHeader>
      <CardContent className="h-[calc(100%-70px)]"> {/* Adjust height considering header padding */}
        {sortedAnnouncements.length > 0 ? (
          // Adjust scroll area height - potentially use flex-grow or explicit height
          // Making ScrollArea fill the remaining space in CardContent
          <ScrollArea className="h-full pr-3">
            <ul className="space-y-4">
              {sortedAnnouncements.map((announcement) => (
                <li key={announcement.id} className="border-b pb-3 last:border-b-0">
                   {/* <p className="text-xs text-muted-foreground mb-1">
                     {new Date(announcement.date).toLocaleDateString()}
                   </p> */}
                  <p className="font-medium text-sm mb-1">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">No recent announcements.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
