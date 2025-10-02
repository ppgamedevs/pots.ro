import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/authz";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;

    // Get invoice
    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    const invoice = invoiceResult[0];
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get order to check access permissions
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, invoice.orderId))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check access permissions
    const isBuyer = order.buyerId === user.id;
    const isSeller = order.sellerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Handle different invoice types
    if (invoice.issuer === 'mock') {
      // Generate mock PDF on-the-fly
      const pdfContent = generateMockInvoicePDF(invoice, order);
      
      return new NextResponse(new Uint8Array(pdfContent), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.series}-${invoice.number}.pdf"`,
        },
      });
    } else {
      // For real providers, fetch the PDF from external URL
      try {
        const response = await fetch(invoice.pdfUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const pdfData = await response.arrayBuffer();

        return new NextResponse(pdfData, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${invoice.series}-${invoice.number}.pdf"`,
          },
        });
      } catch (error) {
        console.error("Error fetching PDF:", error);
        return NextResponse.json({ error: "Failed to fetch invoice PDF" }, { status: 500 });
      }
    }

  } catch (error) {
    console.error("Get invoice PDF error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate a simple mock PDF invoice for testing
 */
function generateMockInvoicePDF(invoice: any, order: any): Buffer {
  // This is a very basic PDF structure for demonstration
  // In a real implementation, you'd use a proper PDF library like pdfkit
  
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 300
>>
stream
BT
/F1 16 Tf
72 720 Td
(INVOICE) Tj
0 -30 Td
/F1 12 Tf
(Series: ${invoice.series}) Tj
0 -20 Td
(Number: ${invoice.number}) Tj
0 -20 Td
(Order ID: ${order.id}) Tj
0 -20 Td
(Total: ${invoice.total} ${invoice.currency}) Tj
0 -20 Td
(Date: ${invoice.createdAt}) Tj
0 -20 Td
(Status: ${invoice.status}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
554
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}
