import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCustomization } from '@/components/landing/LandingCustomization';
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

      <LandingFooter />
    </div>
  )
}
