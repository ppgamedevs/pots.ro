import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservedNames } from "@/db/schema/core";
import { eq, asc } from "drizzle-orm";
import { requireRole } from "@/lib/authz";
import { writeAdminAudit } from "@/lib/admin/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.toLowerCase().trim()),
  reason: z.string().max(500).nullable().optional(),
});

/**
 * GET /api/admin/security/reserved
 * List all reserved names
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);

    const items = await db
      .select({
        name: reservedNames.name,
        reason: reservedNames.reason,
        createdAt: reservedNames.createdAt,
      })
      .from(reservedNames)
      .orderBy(asc(reservedNames.name));

    type ItemType = typeof items[number];
    
    return NextResponse.json({
      items: items.map((item: ItemType) => ({
        name: item.name,
        reason: item.reason,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching reserved names:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch reserved names" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security/reserved
 * Add a new reserved name
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);
    
    const body = await req.json();
    const { name, reason } = addSchema.parse(body);

    // Check if already exists
    const existing = await db.query.reservedNames.findFirst({
      where: eq(reservedNames.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Acest nume este deja rezervat" },
        { status: 400 }
      );
    }

    // Insert
    await db.insert(reservedNames).values({
      name,
      reason: reason || null,
    });

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'reserved_name_add',
      entityType: 'reserved_name',
      entityId: name,
      meta: { name, reason },
    });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error("Error adding reserved name:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Date invalide", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to add reserved name" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/security/reserved?name=xxx
 * Remove a reserved name
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin']);
    
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name")?.toLowerCase().trim();

    if (!name) {
      return NextResponse.json(
        { error: "Numele este obligatoriu" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db.query.reservedNames.findFirst({
      where: eq(reservedNames.name, name),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Numele nu a fost găsit" },
        { status: 404 }
      );
    }

    // Delete
    await db.delete(reservedNames).where(eq(reservedNames.name, name));

    // Audit log
    await writeAdminAudit({
      actorId: user.id,
      action: 'reserved_name_remove',
      entityType: 'reserved_name',
      entityId: name,
      meta: { name, previousReason: existing.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reserved name:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete reserved name" },
      { status: 500 }
    );
  }
}
