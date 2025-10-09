import { NextResponse } from "next/server";

export interface FeaturedProduct {
  id: string;
  image: {
    src: string;
    alt: string;
  };
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
}

export async function GET() {
  try {
    // For now, return empty array since we don't have real products in the database
    // This prevents users from trying to add non-existent products to cart
    const products: FeaturedProduct[] = [];

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
