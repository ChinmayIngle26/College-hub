import type { AcademicEvent } from '@/services/academic-calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Dot } from 'lucide-react';
import { format, parseISO } from 'date-fns';


interface AcademicCalendarCardProps {
  events: AcademicEvent[];
}

export function AcademicCalendarCard({ events }: AcademicCalendarCardProps) {
  const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Academic Calendar
        </CardTitle>
        <CardDescription>Upcoming important dates and holidays.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedEvents.length > 0 ? (
            <ScrollArea className="h-80"> {/* Adjust height as needed */}
            <ul className="space-y-3 pr-4">
                {sortedEvents.map((event, index) => (
                <li key={index} className="flex items-start gap-3">
                    <Dot className="h-5 w-5 mt-0.5 text-accent flex-shrink-0" />
                    <div>
                        <p className="font-medium text-sm">
                            {format(parseISO(event.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                </li>
                ))}
            </ul>
            </ScrollArea>
        ) : (
             <p className="text-center text-muted-foreground">Academic calendar is not available.</p>
        )}
      </CardContent>
    </Card>
  );
}
