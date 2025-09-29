"use client";
import Head from "next/head";

interface ProductStructuredDataProps {
  product: {
    id: string | number;
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    seller: {
      name: string;
      slug: string;
    };
    rating: number;
    reviews: number;
    inStock: boolean;
  };
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.images,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.seller.name
    },
    "offers": {
      "@type": "Offer",
      "url": `https://pots.ro/p/${product.id}`,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.seller.name
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}

interface CategoryStructuredDataProps {
  category: {
    name: string;
    description: string;
    slug: string;
  };
  products: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  }>;
}

export function CategoryStructuredData({ category, products }: CategoryStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description,
    "url": `https://pots.ro/c/${category.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.title,
          "image": product.images[0],
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": product.currency
          }
        }
      }))
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}

interface WebsiteStructuredDataProps {
  name: string;
  description: string;
  url: string;
}

export function WebsiteStructuredData({ name, description, url }: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    "name": name,
    "description": description,
    "url": url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}
