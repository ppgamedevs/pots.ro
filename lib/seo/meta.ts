/**
 * Utilitare pentru meta tags dinamice și SEO
 */

import { Metadata } from 'next';

export interface ProductMetaData {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  seller: {
    brandName: string;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
  slug: string;
}

export interface CategoryMetaData {
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface SellerMetaData {
  brandName: string;
  slug: string;
  description?: string;
  productCount?: number;
}

// Generează meta tags pentru produse
export function generateProductMetadata(product: ProductMetaData): Metadata {
  const title = `${product.title} | ${product.seller.brandName} | Pots.ro`;
  const description = `${product.description.substring(0, 155)}... Preț: ${product.price} ${product.currency}. Livrare rapidă în toată România.`;
  const canonical = `https://pots.ro/p/${product.slug}`;
  const ogImage = product.images[0] || '/og-product-default.jpg';

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Pots.ro',
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.title
        }
      ],
      locale: 'ro_RO'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@potsro'
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': product.currency,
      'product:brand': product.seller.brandName,
      'product:category': product.category.name
    }
  };
}

// Generează meta tags pentru categorii
export function generateCategoryMetadata(category: CategoryMetaData): Metadata {
  const title = `${category.name} la prețuri românești – Pots.ro`;
  const description = category.description || 
    `Descoperă ${category.name.toLowerCase()} de calitate la prețuri accesibile. ${category.productCount ? `${category.productCount} produse disponibile. ` : ''}Livrare rapidă în toată România.`;
  const canonical = `https://pots.ro/c/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Pots.ro',
      url: canonical,
      images: [
        {
          url: '/og-category-default.jpg',
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'ro_RO'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-category-default.jpg'],
      creator: '@potsro'
    }
  };
}

// Generează meta tags pentru vânzători
export function generateSellerMetadata(seller: SellerMetaData): Metadata {
  const title = `${seller.brandName} – Vânzător verificat | Pots.ro`;
  const description = seller.description || 
    `Descoperă produse de calitate de la ${seller.brandName}. ${seller.productCount ? `${seller.productCount} produse disponibile. ` : ''}Vânzător verificat cu livrare rapidă.`;
  const canonical = `https://pots.ro/s/${seller.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'Pots.ro',
      url: canonical,
      images: [
        {
          url: '/og-seller-default.jpg',
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'ro_RO'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-seller-default.jpg'],
      creator: '@potsro'
    }
  };
}

// Generează meta tags pentru pagini de blog
export function generateBlogMetadata(post: {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author?: string;
  image?: string;
}): Metadata {
  const title = `${post.title} | Blog Pots.ro`;
  const description = post.excerpt.substring(0, 155) + '...';
  const canonical = `https://pots.ro/blog/${post.slug}`;
  const ogImage = post.image || '/og-blog-default.jpg';

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Pots.ro',
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      locale: 'ro_RO',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@potsro'
    }
  };
}

// Generează meta tags pentru pagini statice
export function generateStaticPageMetadata(page: {
  title: string;
  description: string;
  slug: string;
  image?: string;
}): Metadata {
  const title = `${page.title} | Pots.ro`;
  const canonical = `https://pots.ro/${page.slug}`;
  const ogImage = page.image || '/og-default.jpg';

  return {
    title,
    description: page.description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description: page.description,
      type: 'website',
      siteName: 'Pots.ro',
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: page.title
        }
      ],
      locale: 'ro_RO'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [ogImage],
      creator: '@potsro'
    }
  };
}

// Helper pentru generarea slug-urilor SEO-friendly
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper pentru validarea URL-urilor canonice
export function isValidCanonicalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'pots.ro' || parsed.hostname === 'www.pots.ro';
  } catch {
    return false;
  }
}