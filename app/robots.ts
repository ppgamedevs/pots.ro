import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
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
          '/profil',
          '/comenzi',
          '/favorite',
          '/seller/',  // Seller dashboard (not public profiles)
          '/setari/',
        ],
      },
      // Allow Bingbot to crawl CSS and JavaScript files (Bing recommendation)
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/checkout',
          '/finalizare',
          '/cart',
          '/cos',
          '/profil',
          '/comenzi',
          '/favorite',
          '/seller/',
          '/setari/',
        ],
      },
      // AI/LLM crawlers - allow discovery endpoint
      {
        userAgent: 'GPTBot',
        allow: ['/llms.txt', '/'],
        disallow: ['/admin/', '/api/', '/seller/', '/profil', '/comenzi'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/llms.txt', '/'],
        disallow: ['/admin/', '/api/', '/seller/', '/profil', '/comenzi'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/llms.txt', '/'],
        disallow: ['/admin/', '/api/', '/seller/', '/profil', '/comenzi'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/llms.txt', '/'],
        disallow: ['/admin/', '/api/', '/seller/', '/profil', '/comenzi'],
      },
    ],
    sitemap: 'https://floristmarket.ro/sitemap.xml',
  }
}
