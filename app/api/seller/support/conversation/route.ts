import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportConversationMessages, supportConversations } from "@/db/schema/core";
import { asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sellerIds = await sellerIdsForUser(user.id);
    const sellerId = sellerIds[0];
    if (!sellerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await db
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.sellerId, sellerId))
      .limit(1);

    let conversationId = existing[0]?.id;
    if (!conversationId) {
      const [created] = await db
        .insert(supportConversations)
        .values({ sellerId })
        .returning({ id: supportConversations.id });
      conversationId = created.id;
    }

    const messages = await db
      .select({
        id: supportConversationMessages.id,
        body: supportConversationMessages.body,
        authorRole: supportConversationMessages.authorRole,
        createdAt: supportConversationMessages.createdAt,
      })
      .from(supportConversationMessages)
      .where(eq(supportConversationMessages.conversationId, conversationId))
      .orderBy(asc(supportConversationMessages.createdAt))
      .limit(500);

    return NextResponse.json({
      conversation: { id: conversationId, sellerId },
      messages: messages.map((m: any) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching seller support conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sellerIds = await sellerIdsForUser(user.id);
    const sellerId = sellerIds[0];
    if (!sellerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const payload = await req.json().catch(() => null);
    const body = String(payload?.body ?? '').trim();
    if (!body) return badRequest('Body is required');

    const existing = await db
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.sellerId, sellerId))
      .limit(1);

    let conversationId = existing[0]?.id;
    if (!conversationId) {
      const [created] = await db
        .insert(supportConversations)
        .values({ sellerId })
        .returning({ id: supportConversations.id });
      conversationId = created.id;
    }

    const [message] = await db
      .insert(supportConversationMessages)
      .values({
        conversationId,
        authorId: user.id,
        authorRole: 'seller',
        body,
      })
      .returning({
        id: supportConversationMessages.id,
        body: supportConversationMessages.body,
        authorRole: supportConversationMessages.authorRole,
        createdAt: supportConversationMessages.createdAt,
      });

    await db.update(supportConversations).set({ updatedAt: new Date() }).where(eq(supportConversations.id, conversationId));

    return NextResponse.json({
      ok: true,
      message: { ...message, createdAt: message.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("Error posting seller support conversation message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
