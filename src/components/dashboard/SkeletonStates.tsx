import { Skeleton } from "@/components/ui/Skeleton"

export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] p-8 border border-white/60 dark:border-white/10 shadow-sm bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-16 w-16 rounded-[1.5rem]" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-12 w-20 rounded-xl" />
      </div>
    </div>
  )
}

export function AppointmentListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-full" />
      </div>
      <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center p-6 rounded-[2rem] bg-white border border-transparent">
            <Skeleton className="h-16 w-16 rounded-[1.5rem] mr-8" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-40 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-60 rounded-full" />
            </div>
            <div className="ml-4 flex items-center gap-4">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-80 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-48 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-14 w-40 rounded-2xl" />
        <Skeleton className="h-14 w-48 rounded-2xl" />
      </div>
    </div>
  )
}
