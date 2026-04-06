import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCustomization } from '@/components/landing/LandingCustomization';
import { CalendarCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-amber-500/30 selection:text-amber-900 overflow-x-hidden">
      
      <Navbar />

      <LandingHero />

      <LandingFeatures />

      <LandingCustomization />

      {/* Static Footer (Server Side Rendered) */}
      <footer className="relative z-10 py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-slate-900 dark:bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                 <CalendarCheck className="h-5 w-5 text-amber-400 dark:text-slate-900" />
               </div>
               <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                 Sched<span className="text-amber-500">Assist</span>
               </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
               © {new Date().getFullYear()} SchedAssist SaaS. Built for world-class clinics.
            </p>
         </div>
      </footer>

    </div>
  )
}
