import { MetadataRoute } from 'next'
import { db } from '@/db'
import { products, categories, sellers } from '@/db/schema/core'
import { eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://floristmarket.ro'
  
  // Static public pages (NOT blocked in robots.txt)
  // Excluded: /cos, /finalizare, /checkout, /cart, /profil, /comenzi (user-specific, blocked by robots)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/cautare`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reduceri`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ajutor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/despre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/termeni`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialitate`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/anpc`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/parteneri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/autentificare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/creare-cont`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  try {
    // Fetch categories from database
    const categoriesData = await db
      .select({
        slug: categories.slug,
        updatedAt: categories.updatedAt,
      })
      .from(categories)

    const categoryPages: MetadataRoute.Sitemap = categoriesData.map((category: InferSelectModel<typeof categories>) => ({
      url: `${baseUrl}/c/${category.slug}`,
      lastModified: category.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    // Fetch active products from database
    const productsData = await db
      .select({
        id: products.id,
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.status, 'active'))
      .limit(50000) // Bing limit: 50,000 URLs per sitemap

    const productPages: MetadataRoute.Sitemap = productsData.map((product: InferSelectModel<typeof products>) => ({
      url: `${baseUrl}/p/${product.slug}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Fetch sellers from database
    const sellersData = await db
      .select({
        slug: sellers.slug,
        updatedAt: sellers.updatedAt,
      })
      .from(sellers)
      .where(eq(sellers.status, 'active'))

    const sellerPages: MetadataRoute.Sitemap = sellersData.map((seller: InferSelectModel<typeof sellers>) => ({
      url: `${baseUrl}/s/${seller.slug}`,
      lastModified: seller.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      ...staticPages,
      ...categoryPages,
      ...productPages,
      ...sellerPages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}
