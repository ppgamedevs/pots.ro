import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSellerByUser } from "@/lib/ownership";
import { constructSellerPath, validateMimeType } from "@/lib/blob";
import { uploadPrepareSchema } from "@/lib/validations";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    const seller = await getSellerByUser(user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { filename, contentType } = uploadPrepareSchema.parse(body);

    if (contentType && !validateMimeType(contentType)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only images are allowed." 
      }, { status: 400 });
    }

    const pathname = constructSellerPath(seller.id, filename);
    
    // Generate signed upload URL
    const blob = await put(pathname, new File([], filename, { type: contentType || 'image/jpeg' }), {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      pathname: pathname,
    });

  } catch (error) {
    console.error("Upload prepare error:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

