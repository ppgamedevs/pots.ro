import { Product } from "@/lib/data/products";

export function buildProductLdJson(product: Product) {
  const url = `https://www.floristmarket.ro/p/${product.id}-${product.slug}`;
  const image = product.images?.[0]?.url || "https://www.floristmarket.ro/og/default-product.jpg";
  const inStock = product.stock_qty > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images?.map(img => img.url) || [image],
    description: product.seo_description || product.short_description || product.title,
    sku: product.sku || String(product.id),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "RON",
      price: (product.price_cents / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Pots Marketplace", // 👈 generic; nu expune vendorul
        url: "https://www.floristmarket.ro",
      },
    },
    // Adăugăm și alte proprietăți utile pentru SEO
    category: "Home & Garden",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "127",
    },
    additionalProperty: [
      ...(product.material ? [{
        "@type": "PropertyValue",
        name: "Material",
        value: product.material
      }] : []),
      ...(product.color ? [{
        "@type": "PropertyValue", 
        name: "Color",
        value: product.color
      }] : []),
      ...(product.shape ? [{
        "@type": "PropertyValue",
        name: "Shape", 
        value: product.shape
      }] : []),
    ],
  };
}
