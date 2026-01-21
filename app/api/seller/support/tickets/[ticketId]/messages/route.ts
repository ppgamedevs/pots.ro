import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTicketMessages, supportTickets } from "@/db/schema/core";
import { asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sellerIdsForUser } from "@/lib/ownership";

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(_req: Request, { params }: { params: { ticketId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sellerIds = await sellerIdsForUser(user.id);
    const sellerId = sellerIds[0];
    if (!sellerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
        authorId: supportTicketMessages.authorId,
      })
      .from(supportTicketMessages)
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
    console.error("Error fetching seller ticket messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { ticketId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sellerIds = await sellerIdsForUser(user.id);
    const sellerId = sellerIds[0];
    if (!sellerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
        authorId: user.id,
        body,
      })
      .returning({
        id: supportTicketMessages.id,
        body: supportTicketMessages.body,
        createdAt: supportTicketMessages.createdAt,
      });

    await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, params.ticketId));

    return NextResponse.json({
      ok: true,
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error posting seller ticket message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
