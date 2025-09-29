import { NextResponse } from "next/server";
import { mockProductsByCategory } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";
import type { Product } from "@/lib/types";

function findProductById(id: number) {
  for (const list of Object.values(mockProductsByCategory)) {
    const found = list.find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return new NextResponse("Bad Request", { status: 400 });

  const product = findProductById(idNum);
  if (!product) return new NextResponse("Not Found", { status: 404 });

  // Extinde cu detalii (descriere, imagini, atribute) când legi DB-ul
  const full: Product = {
    ...product,
    images: [
      { url: product.image, alt: product.title },
      { url: product.image, alt: `${product.title} - imagine 2` },
      { url: product.image, alt: `${product.title} - imagine 3` },
    ],
    descriptionHtml: `<p>Descriere detaliată pentru ${product.title}. Produs de calitate superioară, perfect pentru aranjamente florale moderne.</p><p>Materiale: ceramică de calitate, finisaj mat, sigur pentru plante.</p>`,
    shortDescription: `Descriere scurtă pentru ${product.title}`,
    seoDescription: `Cumpără ${product.title} de la Pots.ro. Calitate superioară, preț competitiv, livrare rapidă.`,
    attributes: { 
      material: "ceramică", 
      finish: "mat",
      color: "natur",
      shape: "rotund",
      diameter_mm: 200,
      height_mm: 150,
      drainage_hole: true,
      saucer_included: false,
      indoor_outdoor: "indoor",
      personalizable: false,
      painted: false,
      tags: ["ceramic", "natur", "modern"],
      ribbon_included: false,
      compatibility: ["bouquet", "box"],
      pack_units: 1,
      food_safe: false,
      created_at: new Date().toISOString(),
      popularity_score: 850,
    },
    stockQty: 12,
    category: "vaze",
  };

  return NextResponse.json(full, { headers: { ...cacheHeaders } });
}
