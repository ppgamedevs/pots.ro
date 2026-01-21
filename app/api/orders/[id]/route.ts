import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, sellers, users, invoices } from "@/db/schema/core";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check access permissions (buyer/admin/support/seller-with-items)
    if (user.role !== "admin" && user.role !== "support" && order.buyerId !== user.id) {
      const userSellerIds = await sellerIdsForUser(user.id);
      if (userSellerIds.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const sellerHasItems = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(and(eq(orderItems.orderId, order.id), inArray(orderItems.sellerId, userSellerIds)))
        .limit(1);

      if (sellerHasItems.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
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
      orderNumber: order.orderNumber,
      buyerEmail: buyer.email,
      status: order.status,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      packedAt: order.packedAt ? order.packedAt.toISOString() : null,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      totals: {
        subtotalCents: order.subtotalCents,
        shippingFeeCents: order.shippingFeeCents,
        totalDiscountCents: order.totalDiscountCents,
        totalCents: order.totalCents,
        currency: order.currency,
      },
      shippingAddress: {
        name:
          shippingAddress?.name ||
          `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim() ||
          buyer.name ||
          "",
        email: shippingAddress?.email || buyer.email,
        phone: shippingAddress?.phone || null,
        address: shippingAddress?.address || null,
        city: shippingAddress?.city || null,
        county: shippingAddress?.county || null,
        postalCode: shippingAddress?.postalCode || null,
        country: shippingAddress?.country || "România",
        notes: shippingAddress?.notes || null,
      },
      items: (orderItemsResult || []).map((item: any) => ({
        id: item.id,
        productName: item.product?.title || "Produs indisponibil",
        productSlug: item.product?.slug || null,
        sellerName: item.seller?.brandName || item.seller?.company || "Vânzător necunoscut",
        sellerId: item.sellerId,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        subtotalCents: item.subtotalCents,
      })),
      tracking: {
        awbNumber: order.awbNumber || null,
        carrier: (order.carrierMeta as any)?.carrier ?? null,
        trackingUrl: (order.carrierMeta as any)?.trackingUrl ?? null,
      },
      invoices: invoicesResult.map((inv: any) => ({
        id: inv.id,
        series: inv.series,
        number: inv.number,
        pdfUrl: inv.pdfUrl,
        total: inv.total != null ? Number(inv.total) : null,
        currency: inv.currency,
        issuer: inv.issuer,
        status: inv.status,
        sellerInvoiceNumber: inv.sellerInvoiceNumber,
        uploadedBy: inv.uploadedBy,
        uploadedAt: inv.uploadedAt ? new Date(inv.uploadedAt).toISOString() : null,
        createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : null,
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
