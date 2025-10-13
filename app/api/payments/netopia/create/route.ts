import { NextRequest, NextResponse } from 'next/server';
import { createNetopiaPaymentRequest, NetopiaPaymentRequest } from '@/lib/netopia';
import { SITE_URL } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency = 'RON', description } = body;

    // Validate required fields
    if (!orderId || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, description' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest: NetopiaPaymentRequest = {
      orderId,
      amount,
      currency,
      description,
      returnUrl: `${SITE_URL}/checkout/success?orderId=${orderId}`,
      confirmUrl: `${SITE_URL}/api/payments/netopia/callback`,
    };

    const paymentResponse = createNetopiaPaymentRequest(paymentRequest);

    return NextResponse.json({
      success: true,
      gateway: paymentResponse.gateway,
      formHtml: paymentResponse.formHtml,
    });

  } catch (error) {
    console.error('Error creating Netopia payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment request' },
      { status: 500 }
    );
  }
}
