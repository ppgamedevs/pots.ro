import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getShippingRules } from '@/lib/shipping/rules';

const shippingRatesSchema = z.object({
  city: z.string().min(1),
  postal_code: z.string().min(1),
  weight_kg: z.number().min(0).optional(),
  volume_dm3: z.number().min(0).optional(),
});

export interface ShippingRate {
  carrier: string;
  service: string;
  fee_cents: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, postal_code, weight_kg = 1, volume_dm3 } = shippingRatesSchema.parse(body);

    // MVP: Simple tiered pricing (hardcoded)
    const rules = await getShippingRules();
    const baseFeeCents = Math.max(0, rules.baseFeeCents);
    const perKgFeeCents = Math.max(0, rules.perKgFeeCents ?? 150);
    const feeCents = calculateCargusRate(weight_kg, baseFeeCents, perKgFeeCents);

    const rates: ShippingRate[] = [{ carrier: 'Cargus', service: 'Standard', fee_cents: feeCents }];

    return NextResponse.json({ rates });

  } catch (error) {
    console.error("Shipping rates error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateCargusRate(weightKg: number, baseFee: number, perKgFee: number): number {
  const excessWeight = Math.max(0, weightKg - 1);
  return Math.max(0, baseFee + Math.round(excessWeight * perKgFee));
}
