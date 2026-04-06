export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex flex-col space-y-10 animate-in fade-in duration-500">
      {/* Skeleton Top Header inside main view */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse" />
        </div>
        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-10">
          {/* Large Card Skeleton */}
          <div className="h-[400px] w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 flex flex-col justify-between shadow-xl shadow-indigo-900/5">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  <div className="h-8 w-40 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
                <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
             </div>
             <div className="h-16 w-full bg-slate-900 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* Small Card Skeleton 1 */}
          <div className="h-[250px] w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-lg shadow-indigo-900/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="space-y-4">
               <div className="h-4 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full animate-pulse" />
               <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Small Card Skeleton 2 */}
          <div className="h-[250px] w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-lg shadow-indigo-900/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="space-y-4">
               <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
               <div className="h-12 w-full bg-slate-900 dark:bg-slate-800 rounded-[1.5rem] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
