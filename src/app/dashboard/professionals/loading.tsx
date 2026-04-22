import { Skeleton } from "@/components/ui/Skeleton"

export default function ProfessionalsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-full" />
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white/40 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-white/5 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-white/5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
