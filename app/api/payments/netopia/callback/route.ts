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
    // Netopia v2 sends JSON, v1 sends form data
    const contentType = request.headers.get('content-type') || '';
    
    let callbackData: any;
    
    if (contentType.includes('application/json')) {
      // Netopia v2 IPN - JSON format
      const jsonBody = await request.json();
      console.log('[Netopia v2 IPN] Received JSON callback:', JSON.stringify(jsonBody, null, 2));
      
      // Netopia v2 IPN structure:
      // { payment: { ntpID, status, ... }, order: { orderID, ... }, error: { code, message } }
      const payment = jsonBody.payment || {};
      const orderData = jsonBody.order || {};
      const error = jsonBody.error || {};
      
      // Map Netopia v2 status codes to our status
      // Status codes: 1=pending, 2=pending_auth, 3=paid, 4=pending_cancel, 5=canceled, 6=refunded
      const ntpStatus = payment.status;
      let mappedStatus = 'pending';
      
      if (ntpStatus === 3 || error.code === '0') {
        mappedStatus = 'paid';
      } else if (ntpStatus === 5 || ntpStatus === 6) {
        mappedStatus = 'failed';
      }
      
      callbackData = {
        orderId: orderData.orderID || payment.orderId || '',
        status: mappedStatus,
        amount: String(orderData.amount || payment.amount || ''),
        currency: orderData.currency || payment.currency || 'RON',
        ntpID: payment.ntpID,
        signature: '', // v2 doesn't use signature in same way
        isV2: true,
      };
      
      console.log('[Netopia v2 IPN] Parsed callback:', callbackData);
    } else {
      // Netopia v1 - Form data format
      const formData = await request.formData();
      callbackData = parseNetopiaCallback(formData);
      callbackData.isV2 = false;
      console.log('[Netopia v1] Callback received:', callbackData);
    }

    // Skip signature verification for v2 (uses different auth mechanism)
    if (!callbackData.isV2) {
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
    }

    // Check if payment was successful
    const isSuccess = callbackData.isV2 
      ? callbackData.status === 'paid'
      : isNetopiaPaymentSuccess(callbackData.status);

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
        
        // Emite factura de comision (doar pentru comision, nu factura principală)
        try {
          const invoiceResponse = await fetch(`${process.env.SITE_URL || 'http://localhost:3000'}/api/internal/invoice-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: callbackData.orderId,
              invoiceType: 'commission', // Emite doar factura de comision
            }),
          });

          if (invoiceResponse.ok) {
            console.log('Commission invoice created for order:', callbackData.orderId);
          } else {
            console.error('Failed to create commission invoice:', await invoiceResponse.text());
          }
        } catch (invoiceError) {
          console.error('Error creating commission invoice:', invoiceError);
          // Don't fail the callback if invoice creation fails
        }

        // Verifică dacă există produse ale platformei și emite factura pentru ele
        try {
          const invoiceResponse = await fetch(`${process.env.SITE_URL || 'http://localhost:3000'}/api/internal/invoice-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: callbackData.orderId,
              invoiceType: 'platform', // Emite factura pentru produsele platformei
            }),
          });

          if (invoiceResponse.ok) {
            console.log('Platform invoice created for order:', callbackData.orderId);
          } else {
            // Nu este o eroare dacă nu există produse ale platformei
            const errorText = await invoiceResponse.text();
            if (!errorText.includes('No platform products')) {
              console.error('Failed to create platform invoice:', errorText);
            }
          }
        } catch (invoiceError) {
          console.error('Error creating platform invoice:', invoiceError);
          // Don't fail the callback if invoice creation fails
        }
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