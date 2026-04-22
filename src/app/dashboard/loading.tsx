import { DashboardHeaderSkeleton, StatCardSkeleton, AppointmentListSkeleton } from "@/components/dashboard/SkeletonStates"
import { Skeleton } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-12">
      {/* Header Skeleton */}
      <DashboardHeaderSkeleton />

      {/* Hero Stats Skeleton */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Analytics Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[400px] rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 shadow-sm" />
        <Skeleton className="lg:col-span-1 h-[400px] rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 shadow-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Appointments List Skeleton */}
        <div className="lg:col-span-8">
          <AppointmentListSkeleton />
        </div>

        {/* Quick Context Panel Skeleton */}
        <div className="lg:col-span-4">
          <Skeleton className="h-[500px] w-full rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10" />
        </div>
      </div>
    </div>
  )
}
