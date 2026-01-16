import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers, users, invoices } from "@/db/schema/core";
import { eq, and, inArray, or } from "drizzle-orm";
import { getUserId, getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    // Parametrul 'id' poate fi fie UUID, fie orderNumber
    // Detectăm dacă este orderNumber (format: ORD-YYYYMMDD-XXXXX)
    const isOrderNumber = /^ORD-\d{8}-[A-Z0-9]{5}$/.test(id);
    
    // Get order - încercăm mai întâi după orderNumber, apoi după UUID
    const orderResult = await db
      .select({
        order: orders,
        buyer: users,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(
        isOrderNumber 
          ? eq(orders.orderNumber, id)
          : eq(orders.id, id)
      )
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { order, buyer } = orderResult[0];

    // Check access permissions
    if (user) {
      const userSellerIds = await sellerIdsForUser(user.id);
      const isBuyer = order.buyerId === user.id;
      const isSeller = userSellerIds.length > 0;
      const isAdmin = user.role === 'admin';

      if (!isBuyer && !isSeller && !isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      // Pentru endpoint-ul public (dacă e nevoie), verificăm doar dacă există comanda
      // În mod normal, ar trebui să fie autentificat
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get order items
    const userSellerIds = user ? await sellerIdsForUser(user.id) : [];
    const isBuyer = user && order.buyerId === user.id;
    const isSeller = userSellerIds.length > 0;
    const isAdmin = user?.role === 'admin';
    
    let orderItemsResult;
    if (isSeller && !isBuyer && !isAdmin && userSellerIds.length > 0) {
      // If user is seller, only show their items
      orderItemsResult = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          sellerId: orderItems.sellerId,
          qty: orderItems.qty,
          unitPriceCents: orderItems.unitPriceCents,
          subtotalCents: orderItems.subtotalCents,
          commissionPct: orderItems.commissionPct,
          commissionAmountCents: orderItems.commissionAmountCents,
          sellerDueCents: orderItems.sellerDueCents,
          product: products,
          seller: sellers,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(sellers, eq(orderItems.sellerId, sellers.id))
        .where(and(
          eq(orderItems.orderId, order.id),
          inArray(orderItems.sellerId, userSellerIds)
        ));
    } else {
      // Show all items for buyer or admin
      orderItemsResult = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          sellerId: orderItems.sellerId,
          qty: orderItems.qty,
          unitPriceCents: orderItems.unitPriceCents,
          subtotalCents: orderItems.subtotalCents,
          commissionPct: orderItems.commissionPct,
          commissionAmountCents: orderItems.commissionAmountCents,
          sellerDueCents: orderItems.sellerDueCents,
          product: products,
          seller: sellers,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(sellers, eq(orderItems.sellerId, sellers.id))
        .where(eq(orderItems.orderId, order.id));
    }

    // Obține facturile asociate
    const invoicesResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, order.id));

    // Formatează răspunsul pentru pagina de comandă
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
        name: shippingAddress?.name || shippingAddress?.firstName + ' ' + shippingAddress?.lastName || buyer.name,
        email: shippingAddress?.email || buyer.email,
        phone: shippingAddress?.phone,
        address: shippingAddress?.address,
        city: shippingAddress?.city,
        county: shippingAddress?.county,
        postalCode: shippingAddress?.postalCode,
        country: shippingAddress?.country || 'România',
        notes: shippingAddress?.notes,
      },
      items: (orderItemsResult || []).map((item: any) => ({
        id: item.id,
        productId: item.product?.id || item.productId,
        productName: item.product?.title || 'Produs indisponibil',
        productSlug: item.product?.slug || null,
        sellerName: item.seller?.brandName || item.seller?.company || 'Vânzător necunoscut',
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        subtotalCents: item.subtotalCents,
      })),
      tracking: {
        awbNumber: order.awbNumber,
        carrier: (order.carrierMeta as any)?.carrier,
        trackingUrl: (order.carrierMeta as any)?.trackingUrl,
      },
      invoices: invoicesResult.map((inv: typeof invoicesResult[0]) => ({
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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}
