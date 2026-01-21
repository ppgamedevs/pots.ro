import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema/core";
import { desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { resolveSellerId } from "@/lib/server/resolve-seller-id";

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = await db
      .select({
        id: supportTickets.id,
        title: supportTickets.title,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        assignedTo: supportTickets.assignedTo,
      })
      .from(supportTickets)
      .where(eq(supportTickets.sellerId, sellerId))
      .orderBy(desc(supportTickets.updatedAt))
      .limit(200);

    return NextResponse.json({
      items: items.map((t: any) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    const title = String(payload?.title ?? '').trim();
    if (!title) return badRequest('Title is required');

    const priority = payload?.priority;

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        sellerId,
        createdBy: userId,
        title,
        description: payload?.description ? String(payload.description) : null,
        ...(priority ? { priority } : {}),
      })
      .returning({
        id: supportTickets.id,
        title: supportTickets.title,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      });

    return NextResponse.json({
      ok: true,
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
