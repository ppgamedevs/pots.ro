'use client';

import { useEffect, useState } from 'react';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Play, Eye } from 'lucide-react';

type RetentionResult = {
  table: string;
  days: number;
  cutoff: string;
  candidateCount: number;
  deletedCount?: number;
  error?: string;
};

type RetentionResponse = {
  ok: boolean;
  retention: {
    dryRun: boolean;
    results: RetentionResult[];
  };
};

export default function AdminComplianceRetentionPage() {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<RetentionResponse | null>(null);
  const [reason, setReason] = useState('');
  const [runDryRun, setRunDryRun] = useState(true);
  const [running, setRunning] = useState(false);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/retention/preview', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to preview retention purge');
      const data = (await res.json()) as RetentionResponse;
      setPreview(data);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const runNow = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/admin/retention/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: runDryRun, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to run retention purge');
      }
      const data = (await res.json()) as RetentionResponse;
      setPreview(data);
      toast.success(data.retention.dryRun ? 'Dry-run completed' : 'Purge completed');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Eroare la run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper
        title="Retention"
        description="Preview and run the settings-driven purge helper (same logic as daily cron)."
        backButtonHref="/admin/compliance"
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh preview
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run</CardTitle>
            <CardDescription>
              This will write an admin audit log entry. Configure windows via Admin Settings (keys starting with retention.).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>dryRun</Label>
              <Input value={String(runDryRun)} onChange={(e) => setRunDryRun(e.target.value === 'true')} placeholder="true | false" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why run retention now?" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button variant="outline" onClick={loadPreview} disabled={loading}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={runNow} disabled={running}>
                <Play className="h-4 w-4 mr-2" />
                {running ? 'Running...' : 'Run now'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Latest preview/run results.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : !preview ? (
              <div className="text-sm text-muted-foreground">No preview yet.</div>
            ) : (
              <div className="space-y-2">
                {preview.retention.results.map((r) => (
                  <div key={r.table} className="border rounded-md p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <div className="font-medium">{r.table}</div>
                      <div className="text-muted-foreground">{r.days} days</div>
                      <div className="text-muted-foreground">cutoff {new Date(r.cutoff).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      candidates: {r.candidateCount}
                      {typeof r.deletedCount === 'number' ? ` • deleted: ${r.deletedCount}` : ''}
                      {r.error ? ` • error: ${r.error}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AdminPageWrapper>
    </main>
  );
}
