'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, Download } from 'lucide-react';

type AuditRow = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  message: string | null;
  meta: any;
};

export default function AdminSecurityAuditPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/audit-logs', window.location.origin);
      if (q.trim()) url.searchParams.set('q', q.trim());
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', '100');

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportUrl = useMemo(() => {
    const url = new URL('/api/admin/audit-logs/export', typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    if (q.trim()) url.searchParams.set('q', q.trim());
    return url.toString();
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Search and export admin audit logs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRows} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <a href={exportUrl}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Quick text search across action/entity/message/meta.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 max-w-2xl">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search (e.g. settings, payout, pii.reveal)" />
          <Button onClick={fetchRows} disabled={loading}>Search</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
          <CardDescription>Showing up to 100 rows.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No audit logs found.</div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    <div className="font-medium">{new Date(r.createdAt).toLocaleString()}</div>
                    <div className="text-muted-foreground">{r.actorEmail || r.actorId || 'unknown actor'}</div>
                    <div className="text-muted-foreground">{r.actorRole || ''}</div>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{r.action}</span>
                    <span className="text-muted-foreground"> — {r.entityType}:{r.entityId}</span>
                  </div>
                  {r.message ? <div className="mt-1 text-sm text-muted-foreground">{r.message}</div> : null}
                  {r.meta ? (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">meta</summary>
                      <pre className="text-xs overflow-auto bg-muted rounded p-2 mt-2">{JSON.stringify(r.meta, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
