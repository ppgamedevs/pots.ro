import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers, categories } from "@/db/schema/core";
import { eq, and, ne } from "drizzle-orm";

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

export interface ProductResponse {
  product: Product;
  similar: Product[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Slug format: "uuid-slug" or just "slug"
    // Try to extract UUID (36 chars with dashes) or use slug directly
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = slug.match(uuidPattern);
    
    let result;
    if (match) {
      // Extract UUID from slug
      const productId = match[0];
      result = await db
        .select({
          product: products,
          seller: sellers,
          category: categories,
        })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.id, productId),
            eq(products.status, 'active')
          )
        )
        .limit(1);
    } else {
      // Try to find by slug only
      result = await db
        .select({
          product: products,
          seller: sellers,
          category: categories,
        })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.slug, slug),
            eq(products.status, 'active')
          )
        )
        .limit(1);
    }

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const { product, seller, category } = result[0];

    // Get product images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.position);

    // Format product response
    const formattedProduct: Product = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description || '',
      price: product.priceCents / 100,
      images: images.length > 0 
        ? images.map(img => ({ src: img.url, alt: img.alt || product.title }))
        : product.imageUrl 
          ? [{ src: product.imageUrl, alt: product.title }]
          : [{ src: '/placeholder.png', alt: product.title }],
      seller: {
        name: seller.brandName,
        href: `/s/${seller.slug}`,
      },
      stockLabel: product.stock > 10 ? 'În stoc' : product.stock > 0 ? 'Stoc redus' : 'Stoc epuizat',
      badges: product.stock < 5 ? ['Stoc redus'] : [],
      attributes: Object.entries(product.attributes as Record<string, any> || {}).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: String(value),
      })),
      category: category?.slug || 'uncategorized',
      tags: [],
    };

    // Get similar products (same category, different product)
    const similarProducts = await db
      .select({
        product: products,
        seller: sellers,
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(
        and(
          eq(products.status, 'active'),
          category ? eq(products.categoryId, category.id) : undefined,
          ne(products.id, product.id)
        )
      )
      .limit(4);

    const similar: Product[] = await Promise.all(
      similarProducts.map(async ({ product: similarProduct, seller: similarSeller }) => {
        const similarImages = await db
          .select()
          .from(productImages)
          .where(
            and(
              eq(productImages.productId, similarProduct.id),
              eq(productImages.isPrimary, true)
            )
          )
          .limit(1);

        return {
          id: similarProduct.id,
          slug: similarProduct.slug,
          title: similarProduct.title,
          description: similarProduct.description || '',
          price: similarProduct.priceCents / 100,
          images: similarImages.length > 0
            ? [{ src: similarImages[0].url, alt: similarImages[0].alt || similarProduct.title }]
            : similarProduct.imageUrl
              ? [{ src: similarProduct.imageUrl, alt: similarProduct.title }]
              : [{ src: '/placeholder.png', alt: similarProduct.title }],
          seller: {
            name: similarSeller.brandName,
            href: `/s/${similarSeller.slug}`,
          },
          stockLabel: similarProduct.stock > 0 ? 'În stoc' : 'Stoc epuizat',
          attributes: [],
          category: category?.slug || 'uncategorized',
          tags: [],
        };
      })
    );

    const response: ProductResponse = {
      product: formattedProduct,
      similar
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
