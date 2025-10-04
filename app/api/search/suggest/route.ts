import { NextRequest, NextResponse } from "next/server";

const ELASTIC_URL = process.env.ELASTIC_URL!;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY!;
const INDEX = process.env.ELASTIC_INDEX || "products";

export async function GET(req: NextRequest) {
  try {
    const q = (new URL(req.url)).searchParams.get("q")?.trim() || "";
    
    if (!q) {
      return NextResponse.json({ suggestions: [] });
    }

    // For MVP, return mock suggestions if Elasticsearch is not configured
    if (!ELASTIC_URL || !ELASTIC_API_KEY) {
      const mockSuggestions = [
        { title: `Ghivece ceramică ${q}`, slug: `ghivece-ceramica-${q}` },
        { title: `Cutii rotunde ${q}`, slug: `cutii-rotunde-${q}` },
        { title: `Ambalaje ${q}`, slug: `ambalaje-${q}` },
        { title: `Accesorii ${q}`, slug: `accesorii-${q}` },
        { title: `Unelte ${q}`, slug: `unelte-${q}` },
        { title: `Decor ${q}`, slug: `decor-${q}` },
      ].slice(0, 6);

      return NextResponse.json({ suggestions: mockSuggestions });
    }

    const body = {
      suggest: {
        product_suggest: {
          prefix: q,
          completion: { 
            field: "suggest", 
            fuzzy: { fuzziness: 1 }, 
            size: 6 
          }
        }
      },
      _source: ["title", "slug"]
    };

    const response = await fetch(`${ELASTIC_URL}/${INDEX}/_search`, {
      method: "POST",
      headers: { 
        Authorization: `ApiKey ${ELASTIC_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Elasticsearch suggest error:", response.status, response.statusText);
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    const suggestions = (data.suggest?.product_suggest?.[0]?.options || [])
      .map((o: any) => ({ 
        title: o._source?.title, 
        slug: o._source?.slug 
      }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Suggest API error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
