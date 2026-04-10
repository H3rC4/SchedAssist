import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCustomization } from '@/components/landing/LandingCustomization';
import { Logo } from '@/components/Logo';
import { CalendarCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden relative">
      
      {/* Absolute Background Noise/Grid */}
      <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none -z-20" />
      <div className="fixed inset-0 noise opacity-20 pointer-events-none -z-20" />

      <Navbar />

      <LandingHero />

      <div className="relative">
         {/* Transition Section */}
         <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-950 to-transparent z-0" />
         
         <LandingFeatures />

         <LandingCustomization />
      </div>

      {/* Premium Footer */}
      <footer className="relative z-10 py-24 border-t border-white/5 bg-slate-950 px-6 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-amber-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
         
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4 scale-110 md:origin-left">
               <Logo />
               <p className="text-slate-500 text-sm font-medium text-center md:text-left max-w-xs leading-relaxed">
                  Llevando la automatización de citas al siguiente nivel con WhatsApp e Inteligencia Artificial.
               </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                  © {new Date().getFullYear()} SchedAssist SaaS.
               </p>
               <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                  Built for world-class clinics.
               </p>
            </div>
         </div>
      </footer>

    </div>
  )
}
