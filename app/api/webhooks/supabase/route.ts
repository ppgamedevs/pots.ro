import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, table, record, old_record } = body;

    console.log(`Supabase webhook received: ${type} on ${table}`);

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("x-supabase-signature");
    if (!signature) {
      console.warn("No signature provided in webhook");
    }

    // Handle different table changes
    switch (table) {
      case "products":
        // Revalidate products cache when products change
        revalidateTag("products");
        console.log("Revalidated products cache");
        break;

      case "categories":
        // Revalidate categories cache when categories change
        revalidateTag("categories");
        console.log("Revalidated categories cache");
        break;

      case "product_images":
        // Revalidate products cache when images change
        revalidateTag("products");
        console.log("Revalidated products cache due to image changes");
        break;

      case "sellers":
        // Revalidate sellers cache when seller info changes
        revalidateTag("sellers");
        console.log("Revalidated sellers cache");
        break;

      default:
        console.log(`No revalidation needed for table: ${table}`);
    }

    return NextResponse.json(
      { 
        message: `Webhook processed for ${type} on ${table}`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: "Supabase webhook endpoint is active",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
