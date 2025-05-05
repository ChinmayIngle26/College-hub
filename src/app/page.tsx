'use client'; // Need client component for hooks

import { getStudentProfile } from '@/services/profile';
import { getAttendanceRecords } from '@/services/attendance';
import { getGrades } from '@/services/grades';
// import { getAcademicCalendar } from '@/services/academic-calendar'; // Assuming this service exists
import { getAnnouncements } from '@/services/announcements'; // Create this service
import { ProfileCard } from '@/components/dashboard/profile-card'; // Reusing existing
import { AttendanceOverviewCard } from '@/components/dashboard/attendance-overview-card'; // Rename/refactor attendance card
import { GradesChartCard } from '@/components/dashboard/grades-chart-card'; // Rename/refactor grades card
import { AnnouncementsCard } from '@/components/dashboard/announcements-card'; // New component
import { SummaryCard } from '@/components/dashboard/summary-card'; // New component for top stats
import { Suspense, useEffect, useState } from 'react'; // Import useEffect, useState
import { Skeleton } from '@/components/ui/skeleton';
import { MainHeader } from '@/components/layout/main-header';
import { Award, CalendarClock, CheckCircle, DoorOpen } from 'lucide-react'; // Icons for summary cards
import { useAuth } from '@/context/auth-context'; // Import useAuth
import type { StudentProfile } from '@/services/profile';
import type { AttendanceRecord } from '@/services/attendance';
import type { Grade } from '@/services/grades';
import type { Announcement } from '@/services/announcements';

// Interface for the complete dashboard data
interface DashboardData {
  profile: StudentProfile | null;
  attendanceRecords: AttendanceRecord[];
  grades: Grade[];
  announcements: Announcement[];
  attendancePercentage: number;
  gpa: string;
  upcomingAppointments: number; // Placeholder
  activeGatePasses: number; // Placeholder
}

// Helper function to calculate GPA
const calculateGPA = (grades: Grade[]): string => {
  if (grades.length === 0) return 'N/A';
  const gradePoints: { [key: string]: number } = { 'A+': 4.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
  const totalPoints = grades.reduce((sum, grade) => sum + (gradePoints[grade.grade.toUpperCase()] || 0), 0);
  return (totalPoints / grades.length).toFixed(1);
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch data in parallel using the user's UID
          const profilePromise = getStudentProfile(user.uid);
          const attendancePromise = getAttendanceRecords(user.uid);
          const gradesPromise = getGrades(user.uid);
          const announcementsPromise = getAnnouncements(); // Announcements are likely global

          const [profile, attendanceRecords, grades, announcements] = await Promise.all([
            profilePromise,
            attendancePromise,
            gradesPromise,
            announcementsPromise,
          ]);

          // Calculate derived data
          const totalDays = attendanceRecords.length;
          const presentDays = attendanceRecords.filter(
            (record) => record.status === 'present'
          ).length;
          const attendancePercentage =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          const gpa = calculateGPA(grades);

          // Placeholder values - replace with actual data fetching later
          const upcomingAppointments = 2;
          const activeGatePasses = 1;

          setData({
            profile,
            attendanceRecords,
            grades,
            announcements,
            attendancePercentage,
            gpa,
            upcomingAppointments,
            activeGatePasses,
          });
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          setError("Failed to load dashboard data. Please try refreshing the page.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (!authLoading && !user) {
      // Handle case where user is not logged in but somehow reached the page
      // This might happen briefly before middleware redirects
      setLoading(false);
      // Optionally redirect or show a message
      console.log("User not logged in, cannot load dashboard.");
    }
  }, [user, authLoading]); // Re-run effect when user or authLoading changes

  if (loading || authLoading) {
    // Show loading skeletons while fetching data or waiting for auth state
    return (
      <>
        <MainHeader />
        <div className="space-y-6">
           <Skeleton className="h-8 w-48" /> {/* Welcome message skeleton */}
            {/* Summary Cards Skeletons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
             {/* Main Content Grid Skeletons */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <div className="lg:col-span-1">
                     <Skeleton className="h-[590px] w-full" />
                </div>
            </div>
        </div>
      </>
    );
  }

  if (error) {
      // Show error message if fetching failed
      return (
          <>
              <MainHeader />
              <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                  <p className="text-destructive">{error}</p>
              </div>
          </>
      )
  }


  if (!data || !data.profile) {
    // Handle case where data fetching completed but resulted in null (e.g., profile not found)
    // Or if the user is somehow null after loading finishes
     return (
          <>
              <MainHeader />
              <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                  <p className="text-muted-foreground">Could not load dashboard information.</p>
              </div>
          </>
      )
  }


  // Render the dashboard with fetched data
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome, {data.profile.name}
        </h2>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Attendance Percentage"
            value={`${data.attendancePercentage}%`}
            icon={CheckCircle}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <SummaryCard
            title="GPA"
            value={data.gpa}
            icon={Award}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <SummaryCard
            title="Upcoming Appointments"
            value={data.upcomingAppointments.toString()}
            icon={CalendarClock}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <SummaryCard
            title="Active Gate Passes"
            value={data.activeGatePasses.toString()}
            icon={DoorOpen}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Attendance and Grades Charts */}
          <div className="space-y-6 lg:col-span-2">
            <AttendanceOverviewCard attendanceRecords={data.attendanceRecords} />
            <GradesChartCard grades={data.grades} />
          </div>

          {/* Announcements */}
          <div className="lg:col-span-1">
            <AnnouncementsCard announcements={data.announcements} />
          </div>
        </div>
      </div>
    </>
  );
}


// --- Loader Components are no longer needed here as data fetching is done in useEffect ---
// --- If you want to keep Suspense boundaries for individual components, ---
// --- you'd wrap the component usage (<AttendanceOverviewCard>, <GradesChartCard>, etc.) ---
// --- within <Suspense> tags on the main page. ---

