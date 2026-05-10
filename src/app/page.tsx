import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCustomization } from '@/components/landing/LandingCustomization';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SchedAssist',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description: 'Automatiza tus citas con IA y WhatsApp. La plataforma SaaS ideal para clínicas.',
  };

  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-primary/30 selection:text-primary-200 overflow-x-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <LandingHero />

      <LandingFeatures />

      <LandingCustomization />

      <footer className="relative z-10 py-24 bg-primary px-6 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-white/[0.05] blur-[100px] rounded-full -z-10 pointer-events-none" />
         
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4 scale-110 md:origin-left">
               <Logo textColor="text-white" />
               <p className="text-white/50 text-sm font-medium text-center md:text-left max-w-xs leading-relaxed">
                  Taking appointment automation to the next level with WhatsApp and Artificial Intelligence.
               </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
               <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">
                  &copy; {new Date().getFullYear()} SchedAssist SaaS.
               </p>
               <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                  Built for world-class clinics.
               </p>
            </div>
         </div>
      </footer>

    </div>
  )
}
