import { StatCardSkeleton, AppointmentListSkeleton, DashboardHeaderSkeleton, DashboardChartsSkeleton } from "@/components/dashboard/SkeletonStates"

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-12 p-4 md:p-12 animate-in fade-in duration-700">
      <DashboardHeaderSkeleton />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <DashboardChartsSkeleton />

      <div className="grid grid-cols-1 gap-12">
        <AppointmentListSkeleton />
      </div>
    </div>
  )
}
