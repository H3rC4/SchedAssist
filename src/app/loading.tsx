import { CalendarCheck } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 animate-in fade-in duration-700">
      <div className="relative group">
        {/* Subtle Outer Glow */}
        <div className="absolute inset-0 bg-amber-500/10 blur-[60px] rounded-full scale-150 animate-pulse" />
        
        {/* Loader Icon Container */}
        <div className="relative h-24 w-24 bg-slate-900 dark:bg-amber-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/10 dark:shadow-black/60 overflow-hidden">
          {/* Internal Loading Animation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
          <CalendarCheck className="h-10 w-10 text-amber-400 dark:text-slate-900 animate-bounce duration-1000" />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 italic">
          Sched<span className="text-amber-500">Assist</span>
        </h2>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.32s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.16s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
