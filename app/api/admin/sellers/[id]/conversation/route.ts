import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportConversationMessages, supportConversations, users } from "@/db/schema/core";
import { asc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { resolveSellerId } from "@/lib/server/resolve-seller-id";

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function requireSupportOrAdmin(userId: string) {
  const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!me || (me.role !== 'admin' && me.role !== 'support')) return null;
  return me;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await requireSupportOrAdmin(userId);
    if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
        author: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        },
      })
      .from(supportConversationMessages)
      .leftJoin(users, eq(users.id, supportConversationMessages.authorId))
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
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await requireSupportOrAdmin(userId);
    if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const payload = await req.json().catch(() => null);
    const body = String(payload?.body ?? '').trim();
    if (!body) return badRequest('Body is required');

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
        authorId: userId,
        authorRole: me.role,
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
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error posting conversation message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
