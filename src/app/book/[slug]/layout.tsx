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

  const title = `Reserva en ${tenant.name} | SchedAssist`;
  const description = tenant.description || `Agenda tu turno online en ${tenant.name} de forma rápida y sencilla.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: tenant.settings?.logo_url ? [tenant.settings.logo_url] : [],
    },
    alternates: {
      canonical: `/book/${params.slug}`,
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
