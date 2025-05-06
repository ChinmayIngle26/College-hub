import { Skeleton } from "@/components/ui/skeleton";
import { MainHeader } from "@/components/layout/main-header"; // Import MainHeader

export default function Loading() {
  // Simulate the layout of the dashboard page while loading
  return (
    <>
      <MainHeader />
      <div className="space-y-6 p-6 md:p-8 lg:p-10"> {/* Added padding */}
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
                  {/* Use approximate height of AnnouncementsCard */}
                  <Skeleton className="h-[590px] w-full" />
              </div>
          </div>
      </div>
    </>
  );
}
