import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
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
      .select({
        id: supportTickets.id,
        sellerId: supportTickets.sellerId,
        title: supportTickets.title,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        assignedTo: supportTickets.assignedTo,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.id, params.ticketId))
      .limit(1);

    if (!ticket || ticket.sellerId !== sellerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string; ticketId: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => null);

    const status = body?.status;
    const priority = body?.priority;
    const assignedTo = body?.assignedTo;

    if (!status && !priority && typeof assignedTo === 'undefined') {
      return badRequest('No changes');
    }

    // Support cannot move tickets into critical end states.
    if (me.role === 'support' && status && (status === 'resolved' || status === 'closed')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(supportTickets)
      .set({
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(typeof assignedTo !== 'undefined' ? { assignedTo } : {}),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, params.ticketId))
      .returning({
        id: supportTickets.id,
        sellerId: supportTickets.sellerId,
        status: supportTickets.status,
        priority: supportTickets.priority,
        assignedTo: supportTickets.assignedTo,
        updatedAt: supportTickets.updatedAt,
      });

    if (!updated || updated.sellerId !== sellerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      ticket: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
