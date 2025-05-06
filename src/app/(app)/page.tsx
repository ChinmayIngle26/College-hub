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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';


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
  // Ensure grade keys are uppercase for matching
  const totalPoints = grades.reduce((sum, grade) => sum + (gradePoints[grade.grade.toUpperCase()] || 0), 0);
  const validGradesCount = grades.filter(grade => gradePoints[grade.grade.toUpperCase()] !== undefined).length;
  if (validGradesCount === 0) return 'N/A'; // Avoid division by zero if no grades have points
  return (totalPoints / validGradesCount).toFixed(1);
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
           // Fetch user profile data from Firestore first
           const userDocRef = doc(db, "users", user.uid);
           const userDocSnap = await getDoc(userDocRef);
           let profileData: StudentProfile | null = null;

           if (userDocSnap.exists()) {
             const userData = userDocSnap.data();
             // Construct the profile object based on Firestore data
             profileData = {
               name: userData.name || 'N/A', // Provide defaults
               studentId: userData.studentId || user.uid, // Use uid as fallback studentId
               major: userData.major || 'N/A',
             };
           } else {
               console.warn(`User document not found for UID: ${user.uid}`);
               // Set a default/fallback profile or handle as error
               profileData = { name: 'User', studentId: user.uid, major: 'Unknown' };
           }


          // Fetch other data in parallel using the user's UID or relevant ID from profile
          // Ensure the services use the correct ID (e.g., profileData.studentId if that's the key)
          const studentIdForServices = profileData?.studentId || user.uid; // Decide which ID to use
          const attendancePromise = getAttendanceRecords(studentIdForServices);
          const gradesPromise = getGrades(studentIdForServices);
          const announcementsPromise = getAnnouncements(); // Announcements are likely global

          const [attendanceRecords, grades, announcements] = await Promise.all([
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
            profile: profileData, // Use the profile data fetched from Firestore
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
      // User is not logged in, loading is complete. Middleware should handle redirect.
      setLoading(false);
      console.log("User not logged in, dashboard won't load.");
      // No need to show an error here, middleware should redirect away.
    }
  }, [user, authLoading]); // Re-run effect when user or authLoading changes

  // Combined Loading State
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
                     <Skeleton className="h-[590px] w-full" /> {/* Adjusted height based on AnnouncementsCard */}
                </div>
            </div>
        </div>
      </>
    );
  }

   // Error State
  if (error) {
      return (
          <>
              <MainHeader />
              <div className="flex h-[calc(100vh-150px)] items-center justify-center"> {/* Adjusted height */}
                  <p className="text-destructive">{error}</p>
              </div>
          </>
      )
  }

   // No User or Data State (after loading)
   // This state might be hit briefly if auth resolves to null before middleware redirects,
   // or if Firestore data is missing critical pieces.
   if (!user || !data || !data.profile) {
     return (
          <>
              {/* Render header only if needed for consistency, or omit */}
              {/* <MainHeader /> */}
              <div className="flex h-screen items-center justify-center"> {/* Full screen centering */}
                  {/* Avoid showing "Could not load" if user is simply not logged in */}
                  {user ? (
                     <p className="text-muted-foreground">Could not load dashboard information.</p>
                  ) : (
                     <p className="text-muted-foreground">Redirecting to sign in...</p> // Or just keep it blank
                  )}
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
             // Specific colors matching screenshot if needed
             // iconBgColor="bg-blue-100"
             // iconColor="text-blue-600"
          />
          <SummaryCard
            title="GPA"
            value={data.gpa}
            icon={Award}
             // iconBgColor="bg-green-100"
             // iconColor="text-green-600"
          />
          <SummaryCard
            title="Upcoming Appointments"
            value={data.upcomingAppointments.toString()}
            icon={CalendarClock}
             // iconBgColor="bg-yellow-100"
             // iconColor="text-yellow-600"
          />
          <SummaryCard
            title="Active Gate Passes"
            value={data.activeGatePasses.toString()}
            icon={DoorOpen}
             // iconBgColor="bg-purple-100"
             // iconColor="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Attendance and Grades */}
          <div className="space-y-6 lg:col-span-2">
            {/* Consider adding Suspense boundary if these components fetch independently */}
            <AttendanceOverviewCard attendanceRecords={data.attendanceRecords} />
            <GradesChartCard grades={data.grades} />
          </div>

          {/* Right Column: Announcements */}
          <div className="lg:col-span-1">
             {/* Consider adding Suspense boundary if this component fetches independently */}
            <AnnouncementsCard announcements={data.announcements} />
          </div>
        </div>
      </div>
    </>
  );
}
