import { NextResponse } from "next/server";
import { mockSellerProducts } from "@/lib/mock";
import { cacheHeaders } from "@/lib/http";
import type { ImageItem } from "@/components/uploader/ProductImagesUploader";

// Mock in-memory storage for product images
const productImages: Record<string, ImageItem[]> = {};

export async function GET(
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

  // Check if product exists
  const product = mockSellerProducts[idNum];
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Get images for this product (or initialize with existing images)
  const images = productImages[idNum] || product.images?.map((img, index) => ({
    id: `img-${idNum}-${index}`,
    url: img.url,
    alt: img.alt,
    isPrimary: index === 0,
    order: index
  })) || [];

  return NextResponse.json(images, { headers: { ...cacheHeaders } });
}

export async function PATCH(
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

  // Check if product exists
  const product = mockSellerProducts[idNum];
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { add = [], delete: deleteIds = [], setPrimary, reorder = [] } = body;

    // Get current images
    let currentImages = productImages[idNum] || product.images?.map((img, index) => ({
      id: `img-${idNum}-${index}`,
      url: img.url,
      alt: img.alt,
      isPrimary: index === 0,
      order: index
    })) || [];

    // Add new images
    if (add.length > 0) {
      const newImages: ImageItem[] = add.map((img: any, index: number) => ({
        id: `img-${idNum}-${Date.now()}-${index}`,
        url: img.url,
        alt: img.alt || `Product image ${currentImages.length + index + 1}`,
        isPrimary: false,
        order: currentImages.length + index
      }));

      currentImages = [...currentImages, ...newImages];
    }

    // Delete images
    if (deleteIds.length > 0) {
      currentImages = currentImages.filter(img => !deleteIds.includes(img.id));
    }

    // Set primary image
    if (setPrimary) {
      currentImages = currentImages.map(img => ({
        ...img,
        isPrimary: img.id === setPrimary
      }));
    }

    // Reorder images
    if (reorder.length > 0) {
      const reorderMap = new Map(reorder.map((item: any) => [item.id, item.order]));
      currentImages = currentImages.map(img => {
        const newOrder = reorderMap.get(img.id);
        return {
          ...img,
          order: typeof newOrder === 'number' ? newOrder : img.order
        };
      });

      // Sort by order
      currentImages.sort((a, b) => a.order - b.order);
    }

    // Ensure at least one image is primary
    const hasPrimary = currentImages.some(img => img.isPrimary);
    if (currentImages.length > 0 && !hasPrimary) {
      currentImages[0].isPrimary = true;
    }

    // Update order to be sequential
    currentImages = currentImages.map((img, index) => ({
      ...img,
      order: index
    }));

    // Store in memory
    productImages[idNum] = currentImages;

    // Update product in mock data
    mockSellerProducts[idNum] = {
      ...product,
      images: currentImages.map(img => ({
        url: img.url,
        alt: img.alt || `Product image`
      }))
    };

    return NextResponse.json(currentImages, { headers: { ...cacheHeaders } });

  } catch (error) {
    console.error('Product images update error:', error);
    return NextResponse.json(
      { error: "Failed to update product images" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  // Check if product exists
  const product = mockSellerProducts[idNum];
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // Clear all images for this product
  delete productImages[idNum];

  // Update product in mock data
  mockSellerProducts[idNum] = {
    ...product,
    images: []
  };

  return NextResponse.json(
    { message: "All images deleted successfully" },
    { headers: { ...cacheHeaders } }
  );
}
