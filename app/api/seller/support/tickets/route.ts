import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets } from "@/db/schema/core";
import { desc, eq } from "drizzle-orm";
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

    const items = await db
      .select({
        id: supportTickets.id,
        title: supportTickets.title,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
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
    console.error("Error fetching seller tickets:", error);
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
    const title = String(payload?.title ?? '').trim();
    if (!title) return badRequest('Title is required');

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        sellerId,
        createdBy: user.id,
        title,
        description: payload?.description ? String(payload.description) : null,
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
    console.error("Error creating seller ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
