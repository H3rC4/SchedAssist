import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';

// Dynamic imports para componentes below-the-fold (reduce 30-50 KiB de JS inicial)
const LandingSocialProof = dynamic(() => import('@/components/landing/LandingSocialProof').then(m => m.LandingSocialProof), { loading: () => <div className="min-h-[120px]" /> });
const LandingHowItWorks = dynamic(() => import('@/components/landing/LandingHowItWorks').then(m => m.LandingHowItWorks), { loading: () => <div className="min-h-[500px]" /> });
const LandingFeatures = dynamic(() => import('@/components/landing/LandingFeatures').then(m => m.LandingFeatures), { loading: () => <div className="min-h-[600px]" /> });
const LandingSecurity = dynamic(() => import('@/components/landing/LandingSecurity').then(m => m.LandingSecurity), { loading: () => <div className="min-h-[400px]" /> });
const LandingPricing = dynamic(() => import('@/components/landing/LandingPricing').then(m => m.LandingPricing), { loading: () => <div className="min-h-[700px]" /> });
const LandingFAQ = dynamic(() => import('@/components/landing/LandingFAQ').then(m => m.LandingFAQ), { loading: () => <div className="min-h-[400px]" /> });
const LandingCTA = dynamic(() => import('@/components/landing/LandingCTA').then(m => m.LandingCTA), { loading: () => <div className="min-h-[200px]" /> });
const LandingFooter = dynamic(() => import('@/components/landing/LandingFooter').then(m => m.LandingFooter), { loading: () => <div className="min-h-[200px]" /> });

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SchedAssist',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '49.00',
      priceCurrency: 'USD',
    },
    description: 'Automatiza tus citas con IA y WhatsApp. La plataforma SaaS líder para la gestión de clínicas y consultorios médicos.',
  };

  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-primary/30 selection:text-primary-200 overflow-x-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main>
        <LandingHero />
        <LandingSocialProof />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingSecurity />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
