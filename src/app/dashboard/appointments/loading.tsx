import { Skeleton } from "@/components/ui/Skeleton"

export default function AppointmentsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-40 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-4 w-full rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          </div>
          
          <Skeleton className="h-[200px] w-full rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10" />
        </div>

        {/* Right Column: Activity Feed Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 flex items-center gap-6">
                <Skeleton className="h-20 w-24 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-48 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-64 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
