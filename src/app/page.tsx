import { getStudentProfile } from '@/services/profile';
import { getAttendanceRecords } from '@/services/attendance';
import { getGrades } from '@/services/grades';
import { getAcademicCalendar } from '@/services/academic-calendar'; // Assuming this service exists
import { getAnnouncements } from '@/services/announcements'; // Create this service
import { ProfileCard } from '@/components/dashboard/profile-card'; // Reusing existing
import { AttendanceOverviewCard } from '@/components/dashboard/attendance-overview-card'; // Rename/refactor attendance card
import { GradesChartCard } from '@/components/dashboard/grades-chart-card'; // Rename/refactor grades card
import { AnnouncementsCard } from '@/components/dashboard/announcements-card'; // New component
import { SummaryCard } from '@/components/dashboard/summary-card'; // New component for top stats
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MainHeader } from '@/components/layout/main-header';
import { Award, CalendarClock, CheckCircle, DoorOpen } from 'lucide-react'; // Icons for summary cards

// Assume a default student ID for demonstration
const STUDENT_ID = '12345';

export default async function DashboardPage() {
  // Fetch data in parallel
  const profilePromise = getStudentProfile(STUDENT_ID);
  const attendancePromise = getAttendanceRecords(STUDENT_ID);
  const gradesPromise = getGrades(STUDENT_ID);
  // const calendarPromise = getAcademicCalendar(); // Keep if needed elsewhere, not directly on main dash
  const announcementsPromise = getAnnouncements(); // Fetch announcements

  // Wait for profile data for the welcome message
  const profile = await profilePromise;

  // Calculate derived data for summary cards
  const attendanceRecords = await attendancePromise; // Need attendance for percentage
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (record) => record.status === 'present'
  ).length;
  const attendancePercentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const grades = await gradesPromise; // Need grades for GPA (assuming calculation logic)
  // Dummy GPA calculation - replace with actual logic
  const calculateGPA = (grades: any[]) => {
    if (grades.length === 0) return 'N/A';
    // Example: A=4, B=3, C=2, D=1, F=0
    const gradePoints: { [key: string]: number } = { 'A+': 4.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    const totalPoints = grades.reduce((sum, grade) => sum + (gradePoints[grade.grade.toUpperCase()] || 0), 0);
    return (totalPoints / grades.length).toFixed(1);
  }
  const gpa = calculateGPA(grades);

  // Dummy data for other summary cards
  const upcomingAppointments = 2; // Replace with actual data fetch
  const activeGatePasses = 1; // Replace with actual data fetch

  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome, {profile.name}
        </h2>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <SummaryCard
              title="Attendance Percentage"
              value={`${attendancePercentage}%`}
              icon={CheckCircle}
              iconBgColor="bg-blue-100" // Example color
              iconColor="text-blue-600"
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
             <SummaryCard
              title="GPA"
              value={gpa}
              icon={Award} // Using Award for GPA
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <SummaryCard
              title="Upcoming Appointments"
              value={upcomingAppointments.toString()}
              icon={CalendarClock} // Changed icon
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
             <SummaryCard
              title="Active Gate Passes"
              value={activeGatePasses.toString()}
              icon={DoorOpen} // Changed icon
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </Suspense>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Attendance and Grades Charts */}
          <div className="space-y-6 lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-72 w-full" />}>
              {/* Use loaded attendance data */}
              <AttendanceOverviewLoader attendanceRecords={attendanceRecords} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-72 w-full" />}>
               {/* Use loaded grades data */}
              <GradesChartLoader grades={grades} />
            </Suspense>
          </div>

          {/* Announcements */}
          <div className="lg:col-span-1">
            <Suspense fallback={<Skeleton className="h-[590px] w-full" />}> {/* Adjusted height */}
              <AnnouncementsLoader announcementsPromise={announcementsPromise} />
            </Suspense>
          </div>
        </div>

        {/* Removed Profile Card (info in header/sidebar), Academic Calendar (not in screenshot main view) */}
         {/* <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <ProfileLoader profilePromise={profilePromise} />
         </Suspense> */}
         {/* <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AcademicCalendarLoader calendarPromise={calendarPromise} />
         </Suspense> */}
      </div>
    </>
  );
}

// --- Loader Components ---

// Keep ProfileLoader if needed elsewhere, but removed from main page view
// async function ProfileLoader({ profilePromise }: { profilePromise: ReturnType<typeof getStudentProfile> }) {
//   const profile = await profilePromise;
//   return <ProfileCard profile={profile} />;
// }

// Loader for the refactored Attendance Overview Card
async function AttendanceOverviewLoader({ attendanceRecords }: { attendanceRecords: Awaited<ReturnType<typeof getAttendanceRecords>> }) {
    // Assume some data processing for the bar chart might happen here or in the component
    // For simplicity, passing raw records
  return <AttendanceOverviewCard attendanceRecords={attendanceRecords} />;
}

// Loader for the refactored Grades Chart Card
async function GradesChartLoader({ grades }: { grades: Awaited<ReturnType<typeof getGrades>> }) {
    // Assume data processing for the donut chart happens here or in the component
  return <GradesChartCard grades={grades} />;
}

// Loader for the new Announcements Card
async function AnnouncementsLoader({ announcementsPromise }: { announcementsPromise: ReturnType<typeof getAnnouncements> }) {
  const announcements = await announcementsPromise;
  return <AnnouncementsCard announcements={announcements} />;
}

// Removed Academic Calendar Loader as it's not in the main screenshot view
// async function AcademicCalendarLoader({ calendarPromise }: { calendarPromise: ReturnType<typeof getAcademicCalendar> }) {
//   const calendarEvents = await calendarPromise;
//   return <AcademicCalendarCard events={calendarEvents} />;
// }
