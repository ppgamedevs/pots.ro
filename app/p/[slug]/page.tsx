import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, sellers, categories } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PDPClient } from "./client";

// Types
interface ProductData {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  oldPriceCents: number | null;
  images: { src: string; alt: string }[];
  seller: {
    id: string;
    name: string;
    slug: string;
    href: string;
  };
  stockQty: number;
  stockLabel: string;
  badges: string[];
  rating: number | null;
  reviewCount: number;
  attributes: { label: string; value: string }[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
}

async function getProduct(slug: string): Promise<ProductData | null> {
  try {
    const [row] = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        description: products.description,
        priceCents: products.priceCents,
        oldPriceCents: products.oldPriceCents,
        images: products.images,
        stockQty: products.stockQty,
        status: products.status,
        tags: products.tags,
        attributes: products.attributes,
        sellerId: products.sellerId,
        categoryId: products.categoryId,
        sellerName: sellers.storeName,
        sellerSlug: sellers.slug,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(sellers, eq(products.sellerId, sellers.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.status, "active")))
      .limit(1);

    if (!row) return null;

    const imagesRaw = row.images as any[];
    const images = Array.isArray(imagesRaw)
      ? imagesRaw.map((img: any, idx: number) => ({
          src: typeof img === "string" ? img : img?.url || img?.src || "/placeholder.svg",
          alt: typeof img === "string" ? row.name : img?.alt || `${row.name} - imagine ${idx + 1}`,
        }))
      : [{ src: "/placeholder.svg", alt: row.name }];

    const attributesRaw = row.attributes as any;
    const attributes = Array.isArray(attributesRaw)
      ? attributesRaw.map((a: any) => ({ label: a.label || a.name || "", value: String(a.value || "") }))
      : [];

    const stockQty = row.stockQty ?? 0;
    const stockLabel =
      stockQty > 10 ? "În stoc" : stockQty > 0 ? `Doar ${stockQty} în stoc` : "Stoc epuizat";

    const badges: string[] = [];
    if (row.oldPriceCents && row.oldPriceCents > row.priceCents) badges.push("reducere");
    if (stockQty > 0 && stockQty <= 3) badges.push("stoc redus");

    return {
      id: row.id,
      slug: row.slug,
      title: row.name,
      description: row.description || "",
      priceCents: row.priceCents,
      oldPriceCents: row.oldPriceCents,
      images,
      seller: {
        id: row.sellerId,
        name: row.sellerName || "Vânzător",
        slug: row.sellerSlug || "",
        href: `/s/${row.sellerSlug || ""}`,
      },
      stockQty,
      stockLabel,
      badges,
      rating: null,
      reviewCount: 0,
      attributes,
      category: {
        id: row.categoryId || "",
        name: row.categoryName || "Produse",
        slug: row.categorySlug || "",
      },
      tags: (row.tags as string[]) || [],
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Produs negăsit",
      description: "Produsul căutat nu a fost găsit pe FloristMarket.ro",
    };
  }

  const price = (product.priceCents / 100).toFixed(2);
  const title = `${product.title} | ${product.seller.name} | ${SITE_NAME}`;
  const description =
    product.description.length > 155
      ? product.description.substring(0, 152) + "..."
      : product.description || `${product.title} disponibil pe ${SITE_NAME}. Preț: ${price} RON. Livrare rapidă în toată România.`;
  const canonical = `${SITE_URL}/p/${product.slug}`;
  const ogImage = product.images[0]?.src || "/og-product-default.jpg";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      locale: "ro_RO",
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`],
    },
    other: {
      "product:price:amount": price,
      "product:price:currency": "RON",
      "product:brand": product.seller.name,
      "product:category": product.category.name,
    },
  };
}

function generateProductSchema(product: ProductData) {
  const price = product.priceCents / 100;
  const availability =
    product.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) =>
      img.src.startsWith("http") ? img.src : `${SITE_URL}${img.src}`
    ),
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.seller.name,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/p/${product.slug}`,
      priceCurrency: "RON",
      price: price.toFixed(2),
      availability,
      seller: {
        "@type": "Organization",
        name: product.seller.name,
        url: `${SITE_URL}/s/${product.seller.slug}`,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RO",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
    },
    category: product.category.name,
    additionalProperty: product.attributes.map((attr) => ({
      "@type": "PropertyValue",
      name: attr.label,
      value: attr.value,
    })),
  };
}

function generateBreadcrumbSchema(product: ProductData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasă",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: `${SITE_URL}/c/${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${SITE_URL}/p/${product.slug}`,
      },
    ],
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema(product);

  // Transform to client format
  const clientProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    price: product.priceCents / 100,
    oldPrice: product.oldPriceCents ? product.oldPriceCents / 100 : undefined,
    images: product.images,
    seller: {
      name: product.seller.name,
      href: product.seller.href,
    },
    stockLabel: product.stockLabel,
    stockQty: product.stockQty,
    badges: product.badges,
    rating: product.rating ?? undefined,
    reviewCount: product.reviewCount,
    attributes: product.attributes,
    category: product.category.name,
    tags: product.tags,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PDPClient product={clientProduct} />
    </>
  );
}
