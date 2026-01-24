import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { backupRuns } from '@/db/schema/core';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

type BackupRunRow = {
  id: string;
  source: 'ci' | 'manual' | 'cron';
  status: 'requested' | 'running' | 'success' | 'failed';
  backupPath: string | null;
  metaPath: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  environment: string | null;
  dbName: string | null;
  createdBy: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);

    const rows = await db
      .select({
        id: backupRuns.id,
        source: backupRuns.source,
        status: backupRuns.status,
        backupPath: backupRuns.backupPath,
        metaPath: backupRuns.metaPath,
        sizeBytes: backupRuns.sizeBytes,
        checksumSha256: backupRuns.checksumSha256,
        environment: backupRuns.environment,
        dbName: backupRuns.dbName,
        createdBy: backupRuns.createdBy,
        errorMessage: backupRuns.errorMessage,
        createdAt: backupRuns.createdAt,
        updatedAt: backupRuns.updatedAt,
      })
      .from(backupRuns)
      .orderBy(desc(backupRuns.createdAt))
      .limit(50);

    const data: BackupRunRow[] = rows.map((r) => ({
      id: String(r.id),
      source: (r.source ?? 'ci') as BackupRunRow['source'],
      status: (r.status ?? 'success') as BackupRunRow['status'],
      backupPath: (r.backupPath as any) ?? null,
      metaPath: (r.metaPath as any) ?? null,
      sizeBytes: (r.sizeBytes as any) ?? null,
      checksumSha256: (r.checksumSha256 as any) ?? null,
      environment: (r.environment as any) ?? null,
      dbName: (r.dbName as any) ?? null,
      createdBy: (r.createdBy as any) ?? null,
      errorMessage: (r.errorMessage as any) ?? null,
      createdAt: new Date(r.createdAt as any).toISOString(),
      updatedAt: new Date(r.updatedAt as any).toISOString(),
    }));

    return NextResponse.json({ ok: true, backups: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  // Admin-only: create a "backup requested" entry.
  try {
    const actor = await requireRole(req, ['admin']);
    const body = (await req.json().catch(() => ({}))) as { reason?: string };

    const reason = (body.reason ?? '').trim();
    if (!reason) {
      return NextResponse.json({ ok: false, error: 'Reason required' }, { status: 400 });
    }

    const [created] = await db
      .insert(backupRuns)
      .values({
        source: 'manual',
        status: 'requested',
        createdBy: actor.id,
        errorMessage: null,
      })
      .returning({ id: backupRuns.id });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'ops.backup.request',
      entityType: 'backup',
      entityId: String(created?.id ?? 'unknown'),
      message: 'Backup requested',
      meta: { reason },
    });

    return NextResponse.json({ ok: true, id: created?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
