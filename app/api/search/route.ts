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
