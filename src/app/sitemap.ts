import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.schedassist.com';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register/clinic`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const supabase = createAdminClient();
    
    const { data: tenants } = await supabase
      .from('tenants')
      .select('slug, updated_at');
      
    if (tenants) {
      const dynamicRoutes = tenants.map((tenant) => ({
        url: `${baseUrl}/book/${tenant.slug}`,
        lastModified: tenant.updated_at ? new Date(tenant.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
      
      routes.push(...dynamicRoutes);
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
  }

  return routes;
}
