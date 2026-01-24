'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type BackupRun = {
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

function encodeBlobPath(path: string): string {
  return path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

export default function AdminOpsBackupsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupRun[]>([]);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  const lastBackup = useMemo(() => {
    const success = backups.find((b) => b.status === 'success');
    return success ?? null;
  }, [backups]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ops/backups', { cache: 'no-store' });
      const json = (await res.json()) as { ok: boolean; backups?: BackupRun[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Failed to load');
      setBackups(json.backups ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestBackup = useCallback(async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Reason required');
      return;
    }

    setRequesting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ops/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmed }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Failed to request backup');
      setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request backup');
    } finally {
      setRequesting(false);
    }
  }, [load, reason]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ops · Backups</h1>
        <p className="text-gray-600 mt-2">
          Restore points index (artifacts stored in Vercel Blob). Restores remain break-glass.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Last successful backup</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {lastBackup ? new Date(lastBackup.createdAt).toLocaleString() : '—'}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {lastBackup?.backupPath ? lastBackup.backupPath : 'No backup artifact path recorded yet.'}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Request a backup</div>
          <div className="mt-2 flex gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason / ticket (required)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void requestBackup()}
              disabled={requesting}
              className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {requesting ? 'Requesting…' : 'Request'}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            This creates a DB request entry; wire it to CI workflow dispatch next.
          </div>
        </div>
      </div>

      <div className="rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Restore points</div>
            <div className="text-xs text-gray-500">Latest 50</div>
          </div>
          <button
            onClick={() => void load()}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading…</div>
        ) : backups.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No backup runs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Env</th>
                  <th className="px-4 py-3">Artifact</th>
                  <th className="px-4 py-3">Meta</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => {
                  const artifactHref = b.backupPath ? `/api/files/${encodeBlobPath(b.backupPath)}` : null;
                  const metaHref = b.metaPath ? `/api/files/${encodeBlobPath(b.metaPath)}` : null;

                  return (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            b.status === 'success'
                              ? 'rounded bg-emerald-50 px-2 py-1 text-emerald-700'
                              : b.status === 'failed'
                              ? 'rounded bg-red-50 px-2 py-1 text-red-700'
                              : 'rounded bg-gray-100 px-2 py-1 text-gray-700'
                          }
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{b.source}</td>
                      <td className="px-4 py-3">{b.environment ?? '—'}</td>
                      <td className="px-4 py-3">
                        {artifactHref ? (
                          <a className="text-blue-700 hover:underline" href={artifactHref}>
                            Download
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {metaHref ? (
                          <a className="text-blue-700 hover:underline" href={metaHref}>
                            Download
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[420px] truncate">{b.errorMessage ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
