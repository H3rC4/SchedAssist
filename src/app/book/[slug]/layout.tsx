import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description, settings')
    .eq('slug', params.slug)
    .single();

  if (!tenant) {
    return {
      title: 'Clínica no encontrada',
    };
  }

  const title = `Reservá en ${tenant.name}`;
  const description = tenant.settings?.booking_instructions || tenant.description || `Agenda tu turno online en ${tenant.name} de forma rápida y sencilla.`;
  const logoUrl = tenant.settings?.logo_url;
  const primaryColor = tenant.settings?.primary_color || '#005c55';

  return {
    title,
    description,
    keywords: [tenant.name, 'turnos', 'citas', 'clínica', 'reserva online'],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: tenant.name,
      images: logoUrl ? [
        {
          url: logoUrl,
          width: 512,
          height: 512,
          alt: `Logo de ${tenant.name}`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: logoUrl ? [logoUrl] : [],
    },
    alternates: {
      canonical: `/book/${params.slug}`,
    },
    icons: {
      icon: logoUrl || undefined,
      shortcut: logoUrl || undefined,
    },
  };
}

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description, settings, id')
    .eq('slug', params.slug)
    .single();

  let jsonLd = null;

  if (tenant) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: tenant.name,
      description: tenant.description || `Clínica médica ${tenant.name}`,
      url: `https://www.schedassist.com/book/${params.slug}`,
      ...(tenant.settings?.logo_url && { image: tenant.settings.logo_url }),
      address: tenant.settings?.city ? {
        '@type': 'PostalAddress',
        addressLocality: tenant.settings.city,
        addressCountry: tenant.settings?.country || 'AR',
      } : undefined,
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
