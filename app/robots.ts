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
        ],
      },
    ],
    sitemap: 'https://floristmarket.ro/sitemap.xml',
  }
}
