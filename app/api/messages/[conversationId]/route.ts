import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, conversations, orders } from "@/db/schema/core";
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "@/lib/authz";
import { validateMessageContent } from "@/lib/antiContact";
import { logMessageSent } from "@/lib/audit";
import { ensureConversation } from "@/lib/conversation-helpers";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { z } from "zod";

const sendMessageSchema = z.object({
  body: z.string().min(1, "Message body is required").max(10000, "Message too long"),
});

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verifică rate limiting pentru mesaje
    const rateLimitResult = await checkRateLimit(request, 'messages');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const conversationId = params.conversationId;
    
    // Parse and validate request body
    const body = await request.json();
    const { body: messageBody } = sendMessageSchema.parse(body);
    
    // Get conversation and verify access
    const conversationResult = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    const conversation = conversationResult[0];
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    // Check if user is participant
    const isBuyer = conversation.buyerId === user.id;
    const isSeller = conversation.sellerId === user.id;
    
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Validate and mask message content
    const validationResult = validateMessageContent(messageBody);
    
    // Insert message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        body: validationResult.maskedBody,
      })
      .returning();
    
    // Log message sent
    await logMessageSent(
      conversation.orderId,
      conversationId,
      user.id,
      user.role,
      validationResult.maskedBody.length,
      validationResult.warning
    );
    
    return NextResponse.json({
      ok: true,
      message: {
        id: newMessage[0].id,
        body: validationResult.maskedBody,
        senderId: user.id,
        createdAt: newMessage[0].createdAt,
      },
      warning: validationResult.warning,
    });
    
  } catch (error) {
    console.error("Send message error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid input",
        details: error.issues 
      }, { status: 422 });
    }
    
    if (error instanceof Error && error.message.includes('Message body')) {
      return NextResponse.json({ 
        ok: false, 
        error: error.message 
      }, { status: 422 });
    }
    
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const conversationId = params.conversationId;
    
    // Get conversation and verify access
    const conversationResult = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    const conversation = conversationResult[0];
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    // Check if user is participant
    const isBuyer = conversation.buyerId === user.id;
    const isSeller = conversation.sellerId === user.id;
    
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Get messages (last 100)
    const messagesResult = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(100);
    
    return NextResponse.json({
      ok: true,
      messages: messagesResult.reverse().map((msg: any) => ({
        id: msg.id,
        body: msg.body,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
      })),
    });
    
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
