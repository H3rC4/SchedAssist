import { Skeleton } from "@/components/ui/Skeleton"

export default function WhatsAppLoading() {
  return (
    <div className="flex-1 p-4 md:p-12 space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-12 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-14 w-full md:w-64 rounded-2xl" />
      </div>

      <div className="grid gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              <Skeleton className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-48 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        ))}
      </div>

      <Skeleton className="h-24 w-full rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10" />
    </div>
  )
}
