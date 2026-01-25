import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { products, categories, sellers } from "@/db/schema/core";
import { eq, and, sql, count, desc, asc } from "drizzle-orm";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PLPClient } from "./client";

// Types
interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  images: { src: string; alt: string }[];
  seller: { name: string };
  badges?: string[];
  stock?: number;
}

interface Facet {
  key: string;
  label: string;
  type: "checkbox" | "range" | "select";
  options: { value: string; label: string; count: number }[];
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
}

const ITEMS_PER_PAGE = 24;

// Category info fallbacks
const categoryInfo: Record<string, { subtitle: string; image?: string }> = {
  ghivece: {
    subtitle: "Descoperă o gamă variată de ghivece pentru plante, de la modele moderne la clasice.",
    image: "/placeholder.svg",
  },
  cutii: {
    subtitle: "Cutii elegante pentru aranjamente florale, cadouri sau decor.",
    image: "/images/cutii-elegante-rosii.jpg",
  },
  accesorii: {
    subtitle: "Toate accesoriile necesare pentru grădinărit și aranjamente florale.",
    image: "/placeholder.svg",
  },
  ambalaje: {
    subtitle: "Ambalaje eco-friendly pentru flori și cadouri.",
    image: "/placeholder.svg",
  },
};

async function getCategory(slug: string): Promise<CategoryData | null> {
  try {
    const [row] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!row) return null;

    // Get product count
    const [countResult] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.categoryId, row.id), eq(products.status, "active")));

    const info = categoryInfo[slug];

    return {
      ...row,
      description: info?.subtitle,
      image: info?.image,
      productCount: countResult?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

async function getCategoryProducts(
  categoryId: string,
  page: number,
  sort: string,
  filters: Record<string, string[]>
): Promise<{ items: Product[]; total: number; totalPages: number; facets: Facet[] }> {
  try {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Build order by
    let orderBy: any[] = [desc(products.createdAt)];
    if (sort === "price_asc") orderBy = [asc(products.priceCents)];
    if (sort === "price_desc") orderBy = [desc(products.priceCents)];
    if (sort === "newest") orderBy = [desc(products.createdAt)];

    // Build where conditions
    const conditions = [eq(products.categoryId, categoryId), eq(products.status, "active")];

    // Price filter
    if (filters.price?.length) {
      const [minStr, maxStr] = filters.price[0].split("-");
      const min = parseInt(minStr) * 100;
      const max = parseInt(maxStr) * 100;
      if (!isNaN(min)) conditions.push(sql`${products.priceCents} >= ${min}`);
      if (!isNaN(max)) conditions.push(sql`${products.priceCents} <= ${max}`);
    }

    // Count total
    const [countResult] = await db
      .select({ count: count() })
      .from(products)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    // Get products
    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        priceCents: products.priceCents,
        imageUrl: products.imageUrl,
        stock: products.stock,
        attributes: products.attributes,
        sellerName: sellers.brandName,
      })
      .from(products)
      .leftJoin(sellers, eq(products.sellerId, sellers.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    const items: Product[] = rows.map((row) => {
      const attrs = (row.attributes as any) || {};
      const oldPriceCents = attrs.oldPriceCents;
      
      const images = row.imageUrl 
        ? [{ src: row.imageUrl, alt: row.title }] 
        : [{ src: "/placeholder.svg", alt: row.title }];

      const badges: string[] = [];
      if (oldPriceCents && oldPriceCents > row.priceCents) badges.push("reducere");
      if (row.stock && row.stock <= 3 && row.stock > 0) badges.push("stoc redus");

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        price: row.priceCents / 100,
        oldPrice: oldPriceCents ? oldPriceCents / 100 : undefined,
        images,
        seller: { name: row.sellerName || "Vânzător" },
        badges: badges.length > 0 ? badges : undefined,
        stock: row.stock ?? 10,
      };
    });

    // Generate facets
    const facets: Facet[] = [
      {
        key: "price",
        label: "Preț",
        type: "range",
        options: [
          { value: "0-50", label: "0 - 50 RON", count: 0 },
          { value: "50-100", label: "50 - 100 RON", count: 0 },
          { value: "100-200", label: "100 - 200 RON", count: 0 },
          { value: "200-500", label: "200 - 500 RON", count: 0 },
        ],
      },
    ];

    return {
      items,
      total,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      facets,
    };
  } catch (error) {
    console.error("Error fetching category products:", error);
    return { items: [], total: 0, totalPages: 0, facets: [] };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Categorie negăsită",
      description: "Categoria căutată nu există pe FloristMarket.ro",
    };
  }

  const info = categoryInfo[slug] || { subtitle: `Produse din categoria ${category.name}` };
  const title = `${category.name} | ${SITE_NAME} - Marketplace pentru Floriști`;
  const description =
    category.description ||
    info.subtitle ||
    `Descoperă ${category.productCount} produse ${category.name.toLowerCase()} pe ${SITE_NAME}. Livrare rapidă în toată România.`;
  const canonical = `${SITE_URL}/c/${category.slug}`;

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
          url: info.image ? `${SITE_URL}${info.image}` : `${SITE_URL}/og-category-default.jpg`,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function generateCollectionSchema(category: CategoryData, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description || categoryInfo[category.slug]?.subtitle,
    url: `${SITE_URL}/c/${category.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.productCount,
      itemListElement: products.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.title,
          url: `${SITE_URL}/p/${product.slug}`,
          image: product.images[0]?.src,
          offers: {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "RON",
            availability:
              (product.stock ?? 10) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  };
}

function generateBreadcrumbSchema(category: CategoryData) {
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
        name: category.name,
        item: `${SITE_URL}/c/${category.slug}`,
      },
    ],
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; filters?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr, sort, filters: filtersStr } = await searchParams;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const page = parseInt(pageStr || "1", 10);
  const sortBy = sort || "relevance";
  let filters: Record<string, string[]> = {};
  try {
    filters = filtersStr ? JSON.parse(filtersStr) : {};
  } catch {
    filters = {};
  }

  const { items, total, totalPages, facets } = await getCategoryProducts(
    category.id,
    page,
    sortBy,
    filters
  );

  const info = categoryInfo[slug] || { subtitle: `Produse din categoria ${category.name}` };

  const collectionSchema = generateCollectionSchema(category, items);
  const breadcrumbSchema = generateBreadcrumbSchema(category);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PLPClient
        category={{
          title: category.name,
          subtitle: category.description || info.subtitle,
          image: info.image,
          slug: category.slug,
        }}
        initialItems={items}
        totalProducts={total}
        facets={facets}
        currentPage={page}
        totalPages={totalPages}
      />
    </>
  );
}