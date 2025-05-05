import { getStudentProfile } from '@/services/profile';
import { getAttendanceRecords } from '@/services/attendance';
import { getGrades } from '@/services/grades';
import { getAcademicCalendar } from '@/services/academic-calendar';
import { ProfileCard } from '@/components/dashboard/profile-card';
import { AttendanceCard } from '@/components/dashboard/attendance-card';
import { GradesCard } from '@/components/dashboard/grades-card';
import { AcademicCalendarCard } from '@/components/dashboard/academic-calendar-card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Assume a default student ID for demonstration
const STUDENT_ID = '12345';

export default async function DashboardPage() {
  // Fetch data in parallel
  const profileData = getStudentProfile(STUDENT_ID);
  const attendanceData = getAttendanceRecords(STUDENT_ID);
  const gradesData = getGrades(STUDENT_ID);
  const calendarData = getAcademicCalendar();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Profile Card */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ProfileLoader profilePromise={profileData} />
      </Suspense>

      {/* Attendance Card */}
      <Suspense fallback={<Skeleton className="h-96 w-full md:col-span-2 lg:col-span-1 xl:col-span-1" />}>
        <AttendanceLoader attendancePromise={attendanceData} />
      </Suspense>

      {/* Grades Card */}
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <GradesLoader gradesPromise={gradesData} />
      </Suspense>

      {/* Academic Calendar Card */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AcademicCalendarLoader calendarPromise={calendarData} />
      </Suspense>
    </div>
  );
}

// Helper components to handle Suspense boundaries cleanly

async function ProfileLoader({ profilePromise }: { profilePromise: ReturnType<typeof getStudentProfile> }) {
  const profile = await profilePromise;
  return <ProfileCard profile={profile} />;
}

async function AttendanceLoader({ attendancePromise }: { attendancePromise: ReturnType<typeof getAttendanceRecords> }) {
  const attendanceRecords = await attendancePromise;
  return <AttendanceCard attendanceRecords={attendanceRecords} />;
}

async function GradesLoader({ gradesPromise }: { gradesPromise: ReturnType<typeof getGrades> }) {
  const grades = await gradesPromise;
  return <GradesCard grades={grades} />;
}

async function AcademicCalendarLoader({ calendarPromise }: { calendarPromise: ReturnType<typeof getAcademicCalendar> }) {
  const calendarEvents = await calendarPromise;
  return <AcademicCalendarCard events={calendarEvents} />;
}
