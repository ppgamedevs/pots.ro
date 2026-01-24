import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { backupRuns } from '@/db/schema/core';

export const dynamic = 'force-dynamic';

type ReportBody = {
  source?: 'ci' | 'manual' | 'cron';
  status: 'running' | 'success' | 'failed';
  backupPath?: string;
  metaPath?: string;
  sizeBytes?: number;
  checksumSha256?: string;
  environment?: string;
  dbName?: string;
  errorMessage?: string;
};

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.OPS_BACKUP_INGEST_SECRET;
  if (!secret) return false;

  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  return auth.slice('Bearer '.length).trim() === secret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ReportBody | null;
  if (!body || !body.status) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const now = new Date();
  const source = body.source ?? 'ci';

  if (body.backupPath) {
    await db
      .insert(backupRuns)
      .values({
        source,
        status: body.status,
        backupPath: body.backupPath,
        metaPath: body.metaPath ?? null,
        sizeBytes: body.sizeBytes ?? null,
        checksumSha256: body.checksumSha256 ?? null,
        environment: body.environment ?? null,
        dbName: body.dbName ?? null,
        errorMessage: body.errorMessage ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: backupRuns.backupPath,
        set: {
          source,
          status: body.status,
          metaPath: body.metaPath ?? null,
          sizeBytes: body.sizeBytes ?? null,
          checksumSha256: body.checksumSha256 ?? null,
          environment: body.environment ?? null,
          dbName: body.dbName ?? null,
          errorMessage: body.errorMessage ?? null,
          updatedAt: now,
        },
      });

    return NextResponse.json({ ok: true });
  }

  // If no backupPath, just record a generic run (not upsertable)
  await db.insert(backupRuns).values({
    source,
    status: body.status,
    metaPath: body.metaPath ?? null,
    sizeBytes: body.sizeBytes ?? null,
    checksumSha256: body.checksumSha256 ?? null,
    environment: body.environment ?? null,
    dbName: body.dbName ?? null,
    errorMessage: body.errorMessage ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true });
}
