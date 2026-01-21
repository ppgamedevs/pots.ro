import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers, users, invoices } from "@/db/schema/core";
import { eq, and, inArray, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
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
      const isAdmin = user.role === 'admin' || user.role === 'support';

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
    const isAdmin = user?.role === 'admin' || user?.role === 'support';
    
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
    // Note: Select only columns that exist in database (type column may not exist)
    let invoicesResult: any[] = [];
    try {
      invoicesResult = await db
        .select({
          id: invoices.id,
          orderId: invoices.orderId,
          series: invoices.series,
          number: invoices.number,
          pdfUrl: invoices.pdfUrl,
          total: invoices.total,
          currency: invoices.currency,
          issuer: invoices.issuer,
          status: invoices.status,
          sellerInvoiceNumber: invoices.sellerInvoiceNumber,
          uploadedBy: invoices.uploadedBy,
          uploadedAt: invoices.uploadedAt,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(eq(invoices.orderId, order.id));
    } catch (invoiceError: any) {
      console.warn('Failed to load invoices:', invoiceError?.message);
      // Return empty array if invoices can't be loaded
      invoicesResult = [];
    }

    const shippingAddress = (order.shippingAddress as any) || {};

    return NextResponse.json({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      buyerEmail: buyer.email,
      status: order.status,
      deliveryStatus: (order.deliveryStatus as any) ?? null,
      awbNumber: order.awbNumber,
      awbLabelUrl: order.awbLabelUrl,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      canceledReason: order.canceledReason,
      shippingAddress,
      items: (orderItemsResult || []).map((item: any) => ({
        id: item.id,
        productName: item.product?.title || 'Produs indisponibil',
        qty: item.qty,
        unitPrice: item.unitPriceCents,
        subtotal: item.subtotalCents,
        sellerId: item.sellerId,
      })),
      totals: {
        subtotal: order.subtotalCents,
        shipping: order.shippingFeeCents,
        tax: 0,
        total: order.totalCents,
      },
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
