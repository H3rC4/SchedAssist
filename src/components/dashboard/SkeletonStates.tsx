import { Skeleton } from "@/components/ui/Skeleton"

export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden p-8 border border-primary/10 bg-white group">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/10" />
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function AppointmentListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="h-1 w-6 bg-primary/20" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center p-8 bg-white border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/5" />
            <Skeleton className="h-16 w-16 mr-10" />
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="ml-6 flex items-center gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-1 w-4 bg-primary/30" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-14 w-96" />
          <Skeleton className="h-14 w-14" />
        </div>
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-14 w-44" />
        <Skeleton className="h-14 w-52" />
      </div>
    </div>
  )
}

export function DashboardChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 bg-white border border-primary/10 p-10 space-y-10 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/5" />
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
      <div className="lg:col-span-4 bg-white border border-primary/10 p-10 space-y-10 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary/5" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[200px] w-[200px] mx-auto" />
        </div>
        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="pt-8 border-t border-primary/10">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    </div>
  )
}
