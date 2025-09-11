import { NextResponse } from "next/server";
import { mockSellerProducts } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";
import type { SellerProduct } from "@/lib/types";

export async function GET(
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

  return NextResponse.json(product, { headers: { ...cacheHeaders } });
}

export async function PUT(
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

  try {
    const body = await request.json();
    
    const updatedProduct = {
      ...product,
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };

    // In a real app, this would update the database
    mockSellerProducts[id] = updatedProduct;

    return NextResponse.json(updatedProduct, { headers: { ...cacheHeaders } });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
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

  // In a real app, this would delete from database
  delete mockSellerProducts[id];

  return NextResponse.json(
    { message: "Product deleted successfully" },
    { headers: { ...cacheHeaders } }
  );
}
