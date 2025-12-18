import { NextResponse } from "next/server";

// In-memory settings store (same as admin)
// In production, this should be fetched from database
const DEFAULT_SHIPPING_FEE_CENTS = 2500; // 25 RON

let cachedShippingFee = DEFAULT_SHIPPING_FEE_CENTS;

/**
 * GET /api/settings/shipping-fee
 * Public endpoint to get current shipping fee
 */
export async function GET() {
  try {
    // In a real implementation, this would fetch from database
    // For now, we'll use the cached value that can be updated via admin API
    
    return NextResponse.json({ 
      shippingFeeCents: cachedShippingFee,
      shippingFeeRON: cachedShippingFee / 100
    });
  } catch (error) {
    console.error("Error fetching shipping fee:", error);
    return NextResponse.json(
      { 
        shippingFeeCents: DEFAULT_SHIPPING_FEE_CENTS,
        shippingFeeRON: DEFAULT_SHIPPING_FEE_CENTS / 100
      },
      { status: 200 } // Still return default value
    );
  }
}

// Helper function to update cached shipping fee (called from admin API)
function updateCachedShippingFee(feeCents: number) {
  cachedShippingFee = feeCents;
}

