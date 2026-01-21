import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTicketMessages, supportTickets, users } from "@/db/schema/core";
import { asc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { resolveSellerId } from "@/lib/server/resolve-seller-id";

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(_req: Request, { params }: { params: { id: string; ticketId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [ticket] = await db
      .select({ id: supportTickets.id, sellerId: supportTickets.sellerId })
      .from(supportTickets)
      .where(eq(supportTickets.id, params.ticketId))
      .limit(1);

    if (!ticket || ticket.sellerId !== sellerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = await db
      .select({
        id: supportTicketMessages.id,
        body: supportTicketMessages.body,
        createdAt: supportTicketMessages.createdAt,
        author: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        },
      })
      .from(supportTicketMessages)
      .leftJoin(users, eq(users.id, supportTicketMessages.authorId))
      .where(eq(supportTicketMessages.ticketId, params.ticketId))
      .orderBy(asc(supportTicketMessages.createdAt))
      .limit(500);

    return NextResponse.json({
      items: items.map((m: any) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string; ticketId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const payload = await req.json().catch(() => null);
    const body = String(payload?.body ?? '').trim();
    if (!body) return badRequest('Body is required');

    const [ticket] = await db
      .select({ id: supportTickets.id, sellerId: supportTickets.sellerId })
      .from(supportTickets)
      .where(eq(supportTickets.id, params.ticketId))
      .limit(1);

    if (!ticket || ticket.sellerId !== sellerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: params.ticketId,
        authorId: userId,
        body,
      })
      .returning({
        id: supportTicketMessages.id,
        body: supportTicketMessages.body,
        createdAt: supportTicketMessages.createdAt,
      });

    // Touch ticket
    await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, params.ticketId));

    return NextResponse.json({
      ok: true,
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating ticket message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
