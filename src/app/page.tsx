import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCustomization } from '@/components/landing/LandingCustomization';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0d] font-sans selection:bg-primary/20 selection:text-primary-200 overflow-x-hidden relative">

      <div className="fixed inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none -z-20" />
      <div className="fixed inset-0 noise opacity-[0.03] pointer-events-none -z-20" />

      <Navbar />

      <LandingHero />

      <LandingFeatures />

      <LandingCustomization />

      <footer className="relative z-10 py-24 border-t border-white/[0.04] bg-[#090a0d] px-6 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/[0.03] blur-[100px] rounded-full -z-10 pointer-events-none" />
         
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4 scale-110 md:origin-left">
               <Logo textColor="text-white" />
               <p className="text-white/40 text-sm font-medium text-center md:text-left max-w-xs leading-relaxed">
                  Taking appointment automation to the next level with WhatsApp and Artificial Intelligence.
               </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
               <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                  &copy; {new Date().getFullYear()} SchedAssist SaaS.
               </p>
               <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                  Built for world-class clinics.
               </p>
            </div>
         </div>
      </footer>

    </div>
  )
}
