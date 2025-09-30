import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { mockSellerProducts } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = parseInt(id);
  
  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

  const product = mockSellerProducts[idNum];
  
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Update product status to active
  const updatedProduct = {
    ...product,
    status: "active" as const,
    updatedAt: new Date().toISOString()
  };

  // In a real app, this would update the database
  mockSellerProducts[idNum] = updatedProduct;

  // ISR revalidation for product
  revalidateTag(`product:${idNum}`);

  return NextResponse.json(
    { 
      message: "Product published successfully",
      product: updatedProduct 
    },
    { headers: { ...cacheHeaders } }
  );
}
