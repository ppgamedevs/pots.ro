import { NextRequest, NextResponse } from 'next/server';
import { parseNetopiaCallback, verifyNetopiaSignature, isNetopiaPaymentSuccess } from '@/lib/netopia';
import { db } from '@/db';
import { orders, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { sendPaymentConfirmationEmail } from '@/lib/email/payment-confirmation';
import { updateInventoryAfterPayment } from '@/lib/inventory/payment-updates';

// Helper function to get order with buyer data
async function getOrderWithBuyer(orderId: string) {
  const orderResult = await db
    .select({
      id: orders.id,
      status: orders.status,
      currency: orders.currency,
      subtotalCents: orders.subtotalCents,
      shippingFeeCents: orders.shippingFeeCents,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      buyer: {
        id: users.id,
        email: users.email,
        name: users.name,
      }
    })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderResult.length) {
    throw new Error('Order not found');
  }

  const orderData = orderResult[0];
  
  // Transform to OrderPublic format
  return {
    id: orderData.id,
    status: orderData.status,
    currency: orderData.currency,
    totals: {
      subtotal_cents: orderData.subtotalCents,
      shipping_fee_cents: orderData.shippingFeeCents,
      total_cents: orderData.totalCents,
      currency: orderData.currency,
    },
    items: [], // We'll get items separately if needed
    createdAt: orderData.createdAt,
    buyer: orderData.buyer,
  };
}

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
      // Update order status in database
      try {
        await db
          .update(orders)
          .set({ 
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(orders.id, callbackData.orderId));
        
        console.log('Order status updated to paid for:', callbackData.orderId);
        
        // Send confirmation email
        try {
          const orderData = await getOrderWithBuyer(callbackData.orderId);
          await sendPaymentConfirmationEmail({
            order: orderData,
            customerEmail: orderData.buyer.email,
            customerName: orderData.buyer.name,
          });
        } catch (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
          // Don't fail the callback if email fails
        }
        
        // Update inventory
        try {
          const orderData = await getOrderWithBuyer(callbackData.orderId);
          await updateInventoryAfterPayment(orderData);
        } catch (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Don't fail the callback if inventory update fails
        }
        
        // TODO: Generate invoice
      } catch (dbError) {
        console.error('Error updating order status:', dbError);
        // Still return success to Netopia to avoid retries
      }
    } else {
      // Update order status to failed
      try {
        await db
          .update(orders)
          .set({ 
            status: 'failed',
            updatedAt: new Date()
          })
          .where(eq(orders.id, callbackData.orderId));
        
        console.log('Order status updated to failed for:', callbackData.orderId);
      } catch (dbError) {
        console.error('Error updating order status to failed:', dbError);
      }
      
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
      // Update order status in database
      try {
        await db
          .update(orders)
          .set({ 
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(orders.id, callbackData.orderId));
        
        console.log('Order status updated to paid for:', callbackData.orderId);
        
        // Send confirmation email
        try {
          const orderData = await getOrderWithBuyer(callbackData.orderId);
          await sendPaymentConfirmationEmail({
            order: orderData,
            customerEmail: orderData.buyer.email,
            customerName: orderData.buyer.name,
          });
        } catch (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
          // Don't fail the callback if email fails
        }
        
        // Update inventory
        try {
          const orderData = await getOrderWithBuyer(callbackData.orderId);
          await updateInventoryAfterPayment(orderData);
        } catch (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Don't fail the callback if inventory update fails
        }
      } catch (dbError) {
        console.error('Error updating order status:', dbError);
      }
    } else {
      // Update order status to failed
      try {
        await db
          .update(orders)
          .set({ 
            status: 'failed',
            updatedAt: new Date()
          })
          .where(eq(orders.id, callbackData.orderId));
        
        console.log('Order status updated to failed for:', callbackData.orderId);
      } catch (dbError) {
        console.error('Error updating order status to failed:', dbError);
      }
      
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