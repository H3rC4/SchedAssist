import { Skeleton } from "@/components/ui/Skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex-1 space-y-8 md:space-y-12 p-4 md:p-12 animate-in fade-in duration-700">
      <div>
        <Skeleton className="h-10 w-80 rounded-lg mb-2" />
        <Skeleton className="h-4 w-48 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white/40 dark:bg-slate-900/40 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 md:p-10 space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
