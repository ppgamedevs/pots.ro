import { NextRequest, NextResponse } from 'next/server';
import { parseNetopiaCallback, verifyNetopiaSignature, isNetopiaPaymentSuccess } from '@/lib/netopia';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callbackData = parseNetopiaCallback(formData);

    console.log('Netopia callback received:', {
      orderId: callbackData.orderId,
      status: callbackData.status,
      amount: callbackData.amount,
      currency: callbackData.currency,
    });

    // Verify signature
    const isValidSignature = verifyNetopiaSignature(
      {
        order_id: callbackData.orderId,
        status: callbackData.status,
        amount: callbackData.amount,
        currency: callbackData.currency,
      },
      callbackData.signature
    );

    if (!isValidSignature) {
      console.error('Invalid Netopia signature for order:', callbackData.orderId);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if payment was successful
    const isSuccess = isNetopiaPaymentSuccess(callbackData.status);

    if (isSuccess) {
      // TODO: Update order status in database
      console.log('Payment successful for order:', callbackData.orderId);
      
      // TODO: Send confirmation email
      // TODO: Update inventory
      // TODO: Generate invoice
    } else {
      console.log('Payment failed for order:', callbackData.orderId, 'Status:', callbackData.status);
    }

    // Return success response to Netopia
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Error processing Netopia callback:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// Also handle GET requests (some payment gateways use GET for callbacks)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const callbackData = {
      orderId: searchParams.get('order_id') || '',
      status: searchParams.get('status') || '',
      amount: searchParams.get('amount') || '',
      currency: searchParams.get('currency') || '',
      signature: searchParams.get('signature') || '',
    };

    console.log('Netopia GET callback received:', callbackData);

    // Verify signature
    const isValidSignature = verifyNetopiaSignature(
      {
        order_id: callbackData.orderId,
        status: callbackData.status,
        amount: callbackData.amount,
        currency: callbackData.currency,
      },
      callbackData.signature
    );

    if (!isValidSignature) {
      console.error('Invalid Netopia signature for order:', callbackData.orderId);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if payment was successful
    const isSuccess = isNetopiaPaymentSuccess(callbackData.status);

    if (isSuccess) {
      console.log('Payment successful for order:', callbackData.orderId);
    } else {
      console.log('Payment failed for order:', callbackData.orderId, 'Status:', callbackData.status);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Error processing Netopia GET callback:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}