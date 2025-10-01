import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/authz";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const orderId = params.orderId;
    
    // Get order
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
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
    
    // Check if AWB exists
    if (!order.awbNumber) {
      return NextResponse.json({ error: "AWB not found for this order" }, { status: 404 });
    }
    
    // If it's a mock provider, generate a simple PDF placeholder
    if ((order.carrierMeta as any)?.provider === 'mock' || (order.carrierMeta as any)?.mockData) {
      // Generate a simple PDF placeholder
      const pdfContent = generateMockLabelPDF(order.awbNumber, order.shippingAddress);
      
      return new NextResponse(new Uint8Array(pdfContent), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="awb-${order.awbNumber}.pdf"`,
        },
      });
    }
    
    // For real providers, fetch the label from the carrier
    if (order.awbLabelUrl) {
      try {
        const response = await fetch(order.awbLabelUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const labelData = await response.arrayBuffer();
        
        return new NextResponse(labelData, {
          headers: {
            'Content-Type': response.headers.get('content-type') || 'application/pdf',
            'Content-Disposition': `attachment; filename="awb-${order.awbNumber}.pdf"`,
          },
        });
      } catch (error) {
        console.error("Error fetching label:", error);
        return NextResponse.json({ error: "Failed to fetch label" }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: "Label URL not available" }, { status: 404 });
    
  } catch (error) {
    console.error("Get AWB label error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate a simple mock PDF label for testing
 */
function generateMockLabelPDF(awbNumber: string, shippingAddress: any): Buffer {
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
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(AWB Number: ${awbNumber}) Tj
0 -20 Td
(Shipping Address:) Tj
0 -15 Td
(${shippingAddress?.name || 'N/A'}) Tj
0 -15 Td
(${shippingAddress?.address || 'N/A'}) Tj
0 -15 Td
(${shippingAddress?.city || 'N/A'}, ${shippingAddress?.county || 'N/A'}) Tj
0 -15 Td
(${shippingAddress?.postalCode || 'N/A'}) Tj
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
454
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}
