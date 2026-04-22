import { Skeleton } from "@/components/ui/Skeleton"

export default function ClientsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-full" />
      </div>

      <Skeleton className="h-12 w-full max-w-md rounded-xl" />

      <div className="rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
