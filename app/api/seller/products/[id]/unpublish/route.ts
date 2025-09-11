import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { mockSellerProducts } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

  const product = mockSellerProducts[id];
  
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Update product status to unpublished
  const updatedProduct = {
    ...product,
    status: "unpublished" as const,
    updatedAt: new Date().toISOString()
  };

  // In a real app, this would update the database
  mockSellerProducts[id] = updatedProduct;

  // ISR revalidation for product
  revalidateTag(`product:${id}`);

  return NextResponse.json(
    { 
      message: "Product unpublished successfully",
      product: updatedProduct 
    },
    { headers: { ...cacheHeaders } }
  );
}
