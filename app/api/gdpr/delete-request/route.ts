import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const deleteRequestSchema = z.object({
  email: z.string().email("Email invalid"),
  confirm: z.literal(true)
});

const exportRequestSchema = z.object({
  email: z.string().email("Email invalid"),
  confirm: z.literal(true)
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    
    // Determine request type based on URL
    const url = new URL(request.url);
    const isDeleteRequest = url.pathname.includes("delete-request");
    
    const schema = isDeleteRequest ? deleteRequestSchema : exportRequestSchema;
    const validatedData = schema.parse(data);
    
    // TODO: Save to database
    // await db.insert(gdprRequests).values({
    //   type: isDeleteRequest ? 'delete' : 'export',
    //   email: validatedData.email,
    //   status: 'pending',
    //   createdAt: new Date()
    // });
    
    // Log for MVP
    console.log(`GDPR ${isDeleteRequest ? 'delete' : 'export'} request:`, {
      email: validatedData.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // TODO: Send email notification to admin
    // await sendEmail({
    //   to: 'admin@floristmarket.ro',
    //   subject: `GDPR ${isDeleteRequest ? 'Delete' : 'Export'} Request`,
    //   template: 'gdpr-request',
    //   data: validatedData
    // });
    
    // TODO: Send confirmation email to user
    // await sendEmail({
    //   to: validatedData.email,
    //   subject: 'Confirmare cerere GDPR',
    //   template: 'gdpr-confirmation',
    //   data: { type: isDeleteRequest ? 'delete' : 'export' }
    // });
    
    return NextResponse.json({ 
      success: true, 
      message: "Cererea a fost trimisă cu succes" 
    });
    
  } catch (error) {
    console.error("GDPR request error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Date invalide", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Eroare internă" },
      { status: 500 }
    );
  }
}
