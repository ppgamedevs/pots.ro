import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    const rates: ShippingRate[] = [
      {
        carrier: 'Cargus',
        service: 'Standard',
        fee_cents: calculateCargusRate(weight_kg),
      },
      {
        carrier: 'DPD',
        service: 'Classic',
        fee_cents: calculateDPDRate(weight_kg),
      },
    ];

    return NextResponse.json({ rates });

  } catch (error) {
    console.error("Shipping rates error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateCargusRate(weightKg: number): number {
  const baseFee = 1999; // 19.99 RON in cents
  const perKgFee = 150; // 1.5 RON per kg over 1kg in cents
  const excessWeight = Math.max(0, weightKg - 1);
  return baseFee + Math.round(excessWeight * perKgFee);
}

function calculateDPDRate(weightKg: number): number {
  const baseFee = 1849; // 18.49 RON in cents
  const perKgFee = 180; // 1.8 RON per kg over 1kg in cents
  const excessWeight = Math.max(0, weightKg - 1);
  return baseFee + Math.round(excessWeight * perKgFee);
}
