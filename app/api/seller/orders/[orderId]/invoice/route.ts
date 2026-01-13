import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, products, sellers, users } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSellerByUser } from "@/lib/ownership";
import { z } from "zod";
import { put } from "@vercel/blob";

const uploadInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  pdfUrl: z.string().url("Invalid PDF URL"),
});

/**
 * POST /api/seller/orders/[orderId]/invoice
 * Permite vânzătorului să încarce factura pentru o comandă
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: "Seller role required" }, { status: 403 });
    }

    const seller = await getSellerByUser(user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    // Verifică dacă comanda aparține vânzătorului
    const orderResult = await db
      .select({
        order: orders,
        orderItem: orderItems,
        product: products,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.id, params.orderId),
          eq(products.sellerId, seller.id)
        )
      )
      .limit(1);

    if (orderResult.length === 0) {
      return NextResponse.json({ 
        error: "Order not found or does not belong to this seller" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { invoiceNumber, pdfUrl } = uploadInvoiceSchema.parse(body);

    // Verifică dacă există deja o factură de tip 'seller' pentru această comandă
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.orderId, params.orderId),
          eq(invoices.type, 'seller')
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      // Actualizează factura existentă
      const updated = await db
        .update(invoices)
        .set({
          sellerInvoiceNumber: invoiceNumber,
          pdfUrl: pdfUrl,
          uploadedBy: user.id,
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, existingInvoice[0].id))
        .returning();

      return NextResponse.json({
        ok: true,
        invoiceId: updated[0].id,
        message: "Invoice updated successfully",
      });
    }

    // Creează factură nouă de tip 'seller'
    const newInvoice = await db
      .insert(invoices)
      .values({
        orderId: params.orderId,
        type: 'seller',
        series: 'SELLER', // Serie pentru facturi vânzător
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        total: orderResult[0].order.totalCents.toString(),
        currency: orderResult[0].order.currency,
        issuer: 'seller',
        status: 'issued',
        sellerInvoiceNumber: invoiceNumber,
        uploadedBy: user.id,
        uploadedAt: new Date(),
      })
      .returning();

    // Trimite email automat către client cu factura atașată
    try {
      const orderData = await db
        .select({
          order: orders,
          buyer: users,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(eq(orders.id, params.orderId))
        .limit(1);

      if (orderData.length > 0 && orderData[0].buyer.email) {
        const { emailService } = await import('@/lib/email');
        const { SellerInvoiceEmail } = await import('@/lib/email/templates/SellerInvoice');

        await emailService.sendEmailWithRetry({
          to: orderData[0].buyer.email,
          subject: `Factura pentru comanda #${params.orderId.slice(-8).toUpperCase()}`,
          template: SellerInvoiceEmail({
            orderId: params.orderId,
            buyerName: orderData[0].buyer.name || 'Client',
            invoiceNumber: invoiceNumber,
            invoiceUrl: pdfUrl,
            sellerName: seller.brandName || seller.company || 'Vânzător',
          }),
        });

        console.log('Seller invoice email sent to:', orderData[0].buyer.email);
      }
    } catch (emailError) {
      console.error('Error sending seller invoice email:', emailError);
      // Nu eșuează upload-ul dacă email-ul eșuează
    }

    return NextResponse.json({
      ok: true,
      invoiceId: newInvoice[0].id,
      message: "Invoice uploaded successfully",
    });

  } catch (error) {
    console.error("Upload seller invoice error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
