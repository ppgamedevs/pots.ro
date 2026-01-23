import { NextResponse } from "next/server";

import { getShippingRules } from '@/lib/shipping/rules';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/shipping-fee
 * Public endpoint to get current shipping fee
 */
export async function GET() {
  try {
    const rules = await getShippingRules();
    const shippingFeeCents = rules.baseFeeCents;
    const freeShippingThresholdCents = rules.freeThresholdCents;

    return NextResponse.json({ 
      shippingFeeCents,
      shippingFeeRON: shippingFeeCents / 100,
      freeShippingThresholdCents,
      freeShippingThresholdRON: freeShippingThresholdCents / 100,
    });
  } catch (error) {
    console.error("Error fetching shipping fee:", error);
    const fallbackFee = 2500;
    return NextResponse.json(
      { 
        shippingFeeCents: fallbackFee,
        shippingFeeRON: fallbackFee / 100,
        freeShippingThresholdCents: 0,
        freeShippingThresholdRON: 0,
      },
      { status: 200 } // Still return default value
    );
  }
}

