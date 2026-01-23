'use client';

import { useEffect, useMemo, useState } from 'react';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Download, Trash2 } from 'lucide-react';

type DsarRow = {
  id: string;
  type: 'export' | 'delete';
  status: string;
  emailHash: string;
  emailDomain: string | null;
  emailMasked: string | null;
  requestedAt: string;
  verifiedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  handledBy: string | null;
  handledByEmail: string | null;
  notes: string | null;
  meta: any;
};

export default function AdminComplianceDsarPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DsarRow[]>([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const fetchRows = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/gdpr/dsar', window.location.origin);
      if (email.trim()) url.searchParams.set('email', email.trim());
      if (status.trim()) url.searchParams.set('status', status.trim());
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', '100');

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load DSAR requests');
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea DSAR queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runExport = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/gdpr/dsar/${id}/generate-export`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to generate export');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr_export_${id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export generated');
      await fetchRows();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Eroare la export');
    }
  };

  const fulfillDelete = async (id: string) => {
    if (!confirm('Fulfill delete request? This will anonymize the user + clear GDPR prefs.')) return;
    try {
      const res = await fetch(`/api/admin/gdpr/dsar/${id}/fulfill-delete`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to fulfill delete');
      }
      toast.success('Delete fulfilled');
      await fetchRows();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Eroare la delete');
    }
  };

  const statusHint = useMemo(() => {
    return 'pending_verification | open | in_progress | fulfilled | rejected | cancelled';
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper
        title="DSAR Requests"
        description="Queue for GDPR export/delete requests (email-verified)."
        backButtonHref="/admin/compliance"
      >
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={fetchRows} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter by exact email match (hashed) and/or status.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder={statusHint} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={fetchRows} disabled={loading}>Search</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>Showing up to 100 rows.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No DSAR requests found.</div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="border rounded-md p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <div className="font-medium">{new Date(r.requestedAt).toLocaleString()}</div>
                      <div className="text-muted-foreground">{r.emailMasked || r.emailHash}</div>
                      <div className="text-muted-foreground">{r.emailDomain || ''}</div>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="font-medium">{r.type}</span>
                      <span className="text-muted-foreground"> — {r.status}</span>
                      {r.dueAt ? <span className="text-muted-foreground"> • due {new Date(r.dueAt).toLocaleDateString()}</span> : null}
                      {r.verifiedAt ? <span className="text-muted-foreground"> • verified</span> : <span className="text-muted-foreground"> • not verified</span>}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.type === 'export' ? (
                        <Button variant="outline" onClick={() => runExport(r.id)} disabled={!r.verifiedAt || r.status === 'fulfilled'}>
                          <Download className="h-4 w-4 mr-2" />
                          Generate export
                        </Button>
                      ) : null}
                      {r.type === 'delete' ? (
                        <Button variant="destructive" onClick={() => fulfillDelete(r.id)} disabled={!r.verifiedAt || r.status === 'fulfilled'}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Fulfill delete
                        </Button>
                      ) : null}
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
