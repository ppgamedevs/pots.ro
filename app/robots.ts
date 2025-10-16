import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/_next/',
        '/checkout',
        '/finalizare',
        '/cart',
        '/cos',
        '/seller-dashboard/',
        '/admin-demo/',
        '/dashboard-demo/',
        '/ui-demo/',
        '/forms-demo/',
        '/demo-form/',
        '/components-demo/',
      ],
    },
    sitemap: 'https://floristmarket.ro/sitemap.xml',
  }
}
