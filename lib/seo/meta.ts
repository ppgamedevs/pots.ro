import { Metadata } from 'next';

// SEO Meta Helpers pentru Pots.ro (română)

export function titleFromProduct(product: { title: string; price?: number; currency?: string }): string {
  const baseTitle = `${product.title} | Pots.ro`;
  
  if (product.price && product.currency) {
    const formattedPrice = new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: product.currency,
    }).format(product.price / 100);
    return `${product.title} - ${formattedPrice} | Pots.ro`;
  }
  
  return baseTitle;
}

export function descFromProduct(product: { 
  title: string; 
  description?: string; 
  price?: number; 
  currency?: string;
  attributes?: Record<string, any>;
}): string {
  let description = product.description || '';
  
  // Dacă nu avem descriere, construim una din atribute
  if (!description && product.attributes) {
    const attrParts = Object.entries(product.attributes)
      .filter(([_, value]) => value && typeof value === 'string')
      .map(([key, value]) => `${key}: ${value}`)
      .slice(0, 3); // Maxim 3 atribute
    
    if (attrParts.length > 0) {
      description = `Produs de calitate cu ${attrParts.join(', ')}.`;
    }
  }
  
  // Dacă încă nu avem descriere, folosim titlul
  if (!description) {
    description = `Cumpără ${product.title} online de la Pots.ro. Produse de calitate pentru casă și grădină.`;
  }
  
  // Adăugăm prețul dacă este disponibil
  if (product.price && product.currency) {
    const formattedPrice = new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: product.currency,
    }).format(product.price / 100);
    description = `${description} Preț: ${formattedPrice}.`;
  }
  
  // Limităm la ~160 caractere pentru SEO
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
}

export function canonical(url: string): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://pots.ro';
  return `${baseUrl}${url}`;
}

export function metaSocial({
  title,
  description,
  url,
  image,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
}): Partial<Metadata> {
  const canonicalUrl = canonical(url);
  const imageUrl = image ? (image.startsWith('http') ? image : canonical(image)) : undefined;
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Pots.ro',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function noindex(enabled: boolean = true): Partial<Metadata> {
  return {
    robots: {
      index: !enabled,
      follow: !enabled,
      googleBot: {
        index: !enabled,
        follow: !enabled,
      },
    },
  };
}

// Helper pentru paginile de produs
export function generateProductMetadata(product: {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  attributes?: Record<string, any>;
  slug?: string;
}): Metadata {
  const title = titleFromProduct(product);
  const description = descFromProduct(product);
  const url = `/p/${product.slug || product.id}`;
  const image = product.images?.[0];
  
  return metaSocial({ title, description, url, image });
}

// Helper pentru paginile de categorie
export function generateCategoryMetadata(category: {
  name: string;
  description?: string;
  slug: string;
}): Metadata {
  const title = `${category.name} — Cumpără online | Pots.ro`;
  const description = category.description || 
    `Explorează ${category.name.toLowerCase()} de la Pots.ro. Produse de calitate pentru casă și grădină. Livrare rapidă în toată România.`;
  const url = `/c/${category.slug}`;
  
  return metaSocial({ title, description, url });
}

// Helper pentru paginile de seller
export function generateSellerMetadata(seller: {
  name: string;
  description?: string;
  slug: string;
}): Metadata {
  const title = `${seller.name} — Magazin pe Pots.ro`;
  const description = seller.description || 
    `Descoperă produsele de la ${seller.name} pe Pots.ro. Magazin verificat cu produse de calitate.`;
  const url = `/s/${seller.slug}`;
  
  return metaSocial({ title, description, url });
}

// Helper pentru paginile de blog
export function generateBlogMetadata(post: {
  title: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
  image?: string;
}): Metadata {
  const title = `${post.title} | Blog Pots.ro`;
  const description = post.excerpt || 
    `Citește ${post.title.toLowerCase()} pe blogul Pots.ro. Sfaturi și inspirații pentru casă și grădină.`;
  const url = `/blog/${post.slug}`;
  
  return metaSocial({ 
    title, 
    description, 
    url, 
    image: post.image 
  });
}

// Helper pentru homepage
export function generateHomepageMetadata(): Metadata {
  const title = 'Pots.ro - Produse pentru casă și grădină';
  const description = 'Descoperă produse de calitate pentru casă și grădină pe Pots.ro. Ghivece, vaze, decor și multe altele. Livrare rapidă în toată România.';
  const url = '/';
  
  return metaSocial({ title, description, url });
}
