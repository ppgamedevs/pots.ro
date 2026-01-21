import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { mapRefundRowToUI } from '@/lib/types.finante';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ['admin']);

    const { id } = await params;

    const row = await db.query.refunds.findFirst({
      where: eq(refunds.id, id),
    });

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(mapRefundRowToUI(row));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
