import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pots.ro'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Category pages
  const categories = [
    { slug: 'ghivece', priority: 0.9 },
    { slug: 'cutii', priority: 0.9 },
    { slug: 'accesorii', priority: 0.9 },
  ]

  const categoryPages = categories.map(category => ({
    url: `${baseUrl}/c/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: category.priority,
  }))

  // Product pages (mock data - in production, fetch from database)
  const products = [
    { id: '1', slug: 'ghiveci-ceramic-alb' },
    { id: '2', slug: 'cutie-inalta-nevopsita' },
    { id: '3', slug: 'panglica-satin' },
  ]

  const productPages = products.map(product => ({
    url: `${baseUrl}/p/${product.id}-${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Seller pages (mock data - in production, fetch from database)
  const sellers = [
    { slug: 'atelier-ceramic' },
    { slug: 'cardboard-street' },
    { slug: 'accesorii-florale' },
  ]

  const sellerPages = sellers.map(seller => ({
    url: `${baseUrl}/s/${seller.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...sellerPages,
  ]
}
