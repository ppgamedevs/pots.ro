import { Metadata } from "next";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: {
    src: string;
    alt: string;
  }[];
  seller: {
    name: string;
    href: string;
  };
  stockLabel: string;
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  attributes: {
    label: string;
    value: string;
  }[];
  category: string;
  tags: string[];
}

export interface CategoryInfo {
  title: string;
  subtitle?: string;
  image?: string;
}

export async function generateProductMetadata(product: Product): Promise<Metadata> {
  const title = `${product.title} | ${product.seller.name} | FloristMarket`;
  const description = product.description.length > 160 
    ? product.description.substring(0, 157) + '...'
    : product.description;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [
        {
          url: product.images[0]?.src || '/placeholder.svg',
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.images[0]?.src || '/placeholder.svg'],
    },
    alternates: {
      canonical: `https://floristmarket.ro/p/${product.slug}`,
    },
  };
}

export async function generateCategoryMetadata(
  categoryInfo: CategoryInfo, 
  productCount: number
): Promise<Metadata> {
  const title = `${categoryInfo.title} | FloristMarket`;
  const description = categoryInfo.subtitle 
    ? `${categoryInfo.subtitle} ${productCount} produse disponibile.`
    : `Descoperă ${productCount} produse din categoria ${categoryInfo.title} pe FloristMarket.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: categoryInfo.image ? [
        {
          url: categoryInfo.image,
          width: 1200,
          height: 630,
          alt: categoryInfo.title,
        },
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: categoryInfo.image ? [categoryInfo.image] : undefined,
    },
    alternates: {
      canonical: `https://floristmarket.ro/c/${categoryInfo.title.toLowerCase()}`,
    },
  };
}

export function generateProductLDJSON(product: Product) {
  const availability = product.stockLabel.toLowerCase().includes('în stoc') 
    ? 'InStock' 
    : 'OutOfStock';

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.images.map(img => img.src),
    "brand": {
      "@type": "Brand",
      "name": product.seller.name
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "RON",
      "availability": `https://schema.org/${availability}`,
      "seller": {
        "@type": "Organization",
        "name": product.seller.name,
        "url": `https://floristmarket.ro${product.seller.href}`
      },
      "url": `https://floristmarket.ro/p/${product.slug}`
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || 0
    } : undefined,
    "category": product.category,
    "additionalProperty": product.attributes.map(attr => ({
      "@type": "PropertyValue",
      "name": attr.label,
      "value": attr.value
    }))
  };
}

export function generateCategoryLDJSON(categoryInfo: CategoryInfo, productCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryInfo.title,
    "description": categoryInfo.subtitle,
    "url": `https://floristmarket.ro/c/${categoryInfo.title.toLowerCase()}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": productCount
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Acasă",
          "item": "https://floristmarket.ro"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryInfo.title,
          "item": `https://floristmarket.ro/c/${categoryInfo.title.toLowerCase()}`
        }
      ]
    }
  };
}
