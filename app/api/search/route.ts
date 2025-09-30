<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, sellers } from "@/db/schema/core";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { searchSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const { q } = searchSchema.parse({ q: query });

    // Search products using full-text search
    const productResults = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        description: products.description,
        priceCents: products.priceCents,
        currency: products.currency,
        imageUrl: products.imageUrl,
        sellerId: products.sellerId,
      })
      .from(products)
      .where(and(
        eq(products.status, 'active'),
        sql`${products.searchTsv} @@ websearch_to_tsquery('simple', ${q})`
      ))
      .limit(8);

    // Search categories
    const categoryResults = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(or(
        ilike(categories.name, `%${q}%`),
        ilike(categories.slug, `%${q}%`)
      ))
      .limit(5);

    // Search sellers
    const sellerResults = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
      })
      .from(sellers)
      .where(or(
        ilike(sellers.brandName, `%${q}%`),
        ilike(sellers.slug, `%${q}%`)
      ))
      .limit(5);

    return NextResponse.json({
      products: productResults,
      categories: categoryResults,
      sellers: sellerResults,
    });

  } catch (error) {
    console.error("Search API error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid query parameter" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

=======
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ products: [], categories: [], sellers: [] });

  // Mock data for development - replace with Supabase when ready
  const mockProducts = [
    { id: 1, slug: "ghiveci-ceramic-alb", title: "Ghiveci ceramic alb", price: 49.9, currency: "RON", image_url: "/placeholder.png", seller_slug: "atelier-ceramic" },
    { id: 2, slug: "cutie-inalta-nevopsita", title: "Cutie înaltă natur", price: 79.0, currency: "RON", image_url: "/placeholder.png", seller_slug: "cardboard-street" },
    { id: 3, slug: "panglica-satin", title: "Panglică satin 25mm", price: 14.5, currency: "RON", image_url: "/placeholder.png", seller_slug: "accesorii-florale" },
  ];

  const mockCategories = [
    { slug: "ghivece", name: "Ghivece" },
    { slug: "cutii", name: "Cutii" },
    { slug: "accesorii", name: "Accesorii" },
  ];

  const mockSellers = [
    { slug: "atelier-ceramic", brand_name: "Atelier Ceramic" },
    { slug: "cardboard-street", brand_name: "Cardboard Street" },
    { slug: "accesorii-florale", brand_name: "Accesorii Florale" },
  ];

  // Simple search filter
  const filteredProducts = mockProducts.filter(p => 
    p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.slug.toLowerCase().includes(q.toLowerCase())
  );

  const filteredCategories = mockCategories.filter(c => 
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.slug.toLowerCase().includes(q.toLowerCase())
  );

  const filteredSellers = mockSellers.filter(s => 
    s.brand_name.toLowerCase().includes(q.toLowerCase()) ||
    s.slug.toLowerCase().includes(q.toLowerCase())
  );

  return NextResponse.json({
    products: filteredProducts.slice(0, 8),
    categories: filteredCategories.slice(0, 5),
    sellers: filteredSellers.slice(0, 5),
  });
}
>>>>>>> main
