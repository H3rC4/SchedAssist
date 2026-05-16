import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingSocialProof } from '@/components/landing/LandingSocialProof';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingSecurity } from '@/components/landing/LandingSecurity';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

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
