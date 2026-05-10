import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/doctor/',
        '/superadmin/',
        '/api/',
      ],
    },
    sitemap: 'https://www.schedassist.com/sitemap.xml',
  };
}
