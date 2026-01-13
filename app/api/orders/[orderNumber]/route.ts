import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers, users, invoices } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

/**
 * GET /api/orders/[orderNumber]
 * Obține datele reale ale unei comenzi după orderNumber
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const user = await getCurrentUser();

    // Găsește comanda după orderNumber
    const orderResult = await db
      .select({
        order: orders,
        buyer: users,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { order, buyer } = orderResult[0];

    // Verifică dacă utilizatorul are acces la această comandă
    if (user && user.role !== 'admin' && user.id !== order.buyerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Obține item-urile comenzii cu detalii produse
    const itemsResult = await db
      .select({
        orderItem: orderItems,
        product: products,
        seller: sellers,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(eq(orderItems.orderId, order.id));

    // Obține facturile asociate
    const invoicesResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, order.id));

    // Formatează răspunsul
    const shippingAddress = order.shippingAddress as any;

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      packedAt: order.packedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      totals: {
        subtotal_cents: order.subtotalCents,
        shipping_fee_cents: order.shippingFeeCents,
        total_discount_cents: order.totalDiscountCents,
        total_cents: order.totalCents,
        currency: order.currency,
      },
      shippingAddress: {
        name: shippingAddress?.name || shippingAddress?.firstName + ' ' + shippingAddress?.lastName,
        email: shippingAddress?.email || buyer.email,
        phone: shippingAddress?.phone,
        address: shippingAddress?.address,
        city: shippingAddress?.city,
        county: shippingAddress?.county,
        postalCode: shippingAddress?.postalCode,
        country: shippingAddress?.country || 'România',
        notes: shippingAddress?.notes,
      },
      items: itemsResult.map((item) => ({
        id: item.orderItem.id,
        productId: item.product.id,
        productName: item.product.title,
        productSlug: item.product.slug,
        sellerName: item.seller.brandName || item.seller.company,
        qty: item.orderItem.qty,
        unitPriceCents: item.orderItem.unitPriceCents,
        subtotalCents: item.orderItem.subtotalCents,
      })),
      tracking: {
        awbNumber: order.awbNumber,
        carrier: (order.carrierMeta as any)?.carrier,
        trackingUrl: (order.carrierMeta as any)?.trackingUrl,
      },
      invoices: invoicesResult.map((inv) => ({
        id: inv.id,
        type: inv.type,
        series: inv.series,
        number: inv.number,
        pdfUrl: inv.pdfUrl,
        total: Number(inv.total),
        currency: inv.currency,
        issuer: inv.issuer,
        status: inv.status,
        sellerInvoiceNumber: inv.sellerInvoiceNumber,
        createdAt: inv.createdAt,
      })),
    });

  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
