import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const exportRequestSchema = z.object({
  email: z.string().email("Email invalid"),
  confirm: z.literal(true)
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    
    const validatedData = exportRequestSchema.parse(data);
    
    // TODO: Save to database
    // await db.insert(gdprRequests).values({
    //   type: 'export',
    //   email: validatedData.email,
    //   status: 'pending',
    //   createdAt: new Date()
    // });
    
    // Log for MVP
    console.log("GDPR export request:", {
      email: validatedData.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // TODO: Send email notification to admin
    // await sendEmail({
    //   to: 'admin@floristmarket.ro',
    //   subject: 'GDPR Export Request',
    //   template: 'gdpr-export-request',
    //   data: validatedData
    // });
    
    // TODO: Send confirmation email to user
    // await sendEmail({
    //   to: validatedData.email,
    //   subject: 'Confirmare cerere export GDPR',
    //   template: 'gdpr-export-confirmation',
    //   data: validatedData
    // });
    
    return NextResponse.json({ 
      success: true, 
      message: "Cererea de export a fost trimisă cu succes" 
    });
    
  } catch (error) {
    console.error("GDPR export request error:", error);
    
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
