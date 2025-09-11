import { NextResponse } from "next/server";
import { mockSellers } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const seller = mockSellers[params.slug];
  if (!seller) return new NextResponse("Not Found", { status: 404 });

  // read-only public, fără date de contact
  return NextResponse.json(seller, { headers: { ...cacheHeaders } });
}
