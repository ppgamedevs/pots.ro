export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  seller: {
    name: string;
    url: string;
  };
  category?: string;
}

export interface SellerData {
  id: string;
  name: string;
  description?: string;
  url: string;
  logo?: string;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pots.ro",
    "url": "https://floristmarket.ro",
    "logo": "https://floristmarket.ro/logo.png",
    "description": "Romania's premier marketplace for pottery and ceramics",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+40-XXX-XXX-XXX",
      "contactType": "customer service",
      "email": "contact@floristmarket.ro"
    },
    "sameAs": [
      "https://facebook.com/floristmarket.ro",
      "https://instagram.com/floristmarket.ro"
    ]
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pots.ro",
    "url": "https://floristmarket.ro",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://floristmarket.ro/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function productSchema(product: ProductData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.seller.name
    },
    "offers": {
      "@type": "Offer",
      "url": `https://floristmarket.ro/p/${product.id}`,
      "priceCurrency": product.currency,
      "price": product.price / 100,
      "availability": `https://schema.org/${product.availability}`,
      "seller": {
        "@type": "Organization",
        "name": product.seller.name,
        "url": product.seller.url
      }
    },
    "category": product.category
  };
}

export function storeSchema(seller: SellerData) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": seller.name,
    "description": seller.description,
    "url": seller.url,
    "logo": seller.logo,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "RO"
    }
  };
}

export function aggregateOfferSchema(products: ProductData[]) {
  const prices = products.map(p => p.price / 100);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = products[0]?.currency || 'RON';

  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    "priceCurrency": currency,
    "lowPrice": minPrice,
    "highPrice": maxPrice,
    "offerCount": products.length,
    "offers": products.map(product => ({
      "@type": "Offer",
      "url": `https://floristmarket.ro/p/${product.id}`,
      "priceCurrency": product.currency,
      "price": product.price / 100,
      "availability": `https://schema.org/${product.availability}`,
      "seller": {
        "@type": "Organization",
        "name": product.seller.name,
        "url": product.seller.url
      }
    }))
  };
}
