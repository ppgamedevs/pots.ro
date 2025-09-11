import { NextResponse } from "next/server";
import { mockCategories } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export async function GET() {
  return new NextResponse(JSON.stringify(mockCategories), {
    status: 200,
    headers: { 
      "Content-Type": "application/json", 
      ...cacheHeaders 
    },
  });
}
