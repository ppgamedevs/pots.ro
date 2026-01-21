import { NextResponse } from "next/server";
import { db } from "@/db";
import { sellerNotes, users } from "@/db/schema/core";
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
        id: sellerNotes.id,
        body: sellerNotes.body,
        createdAt: sellerNotes.createdAt,
        updatedAt: sellerNotes.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        },
      })
      .from(sellerNotes)
      .leftJoin(users, eq(users.id, sellerNotes.authorId))
      .where(eq(sellerNotes.sellerId, sellerId))
      .orderBy(desc(sellerNotes.createdAt))
      .limit(200);

    return NextResponse.json({
      items: items.map((n: any) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching seller notes:", error);
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

    const body = await req.json().catch(() => null);
    const noteBody = String(body?.body ?? '').trim();
    if (!noteBody) return badRequest('Body is required');

    const [inserted] = await db
      .insert(sellerNotes)
      .values({
        sellerId,
        authorId: userId,
        body: noteBody,
      })
      .returning({
        id: sellerNotes.id,
        body: sellerNotes.body,
        createdAt: sellerNotes.createdAt,
        updatedAt: sellerNotes.updatedAt,
      });

    return NextResponse.json({
      ok: true,
      note: {
        ...inserted,
        createdAt: inserted.createdAt.toISOString(),
        updatedAt: inserted.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating seller note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
