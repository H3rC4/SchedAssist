import { Skeleton } from "@/components/ui/Skeleton"
import { DashboardChartsSkeleton } from "@/components/dashboard/SkeletonStates"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[120px] rounded-3xl" />
        <Skeleton className="h-[120px] rounded-3xl" />
        <Skeleton className="h-[120px] rounded-3xl" />
      </div>

      <DashboardChartsSkeleton />
    </div>
  )
}
