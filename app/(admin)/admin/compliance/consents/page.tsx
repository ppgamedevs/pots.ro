'use client';

import { useEffect, useMemo, useState } from 'react';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, RefreshCw, Save } from 'lucide-react';

type ConsentRow = {
  id: string;
  createdAt: string;
  emailHash: string;
  emailDomain: string | null;
  emailMasked: string | null;
  consentType: 'necessary' | 'all';
  legalBasis: string;
  source: string;
  actorId: string | null;
  actorEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  policyVersion: string | null;
};

export default function AdminComplianceConsentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConsentRow[]>([]);

  const [email, setEmail] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [updateEmail, setUpdateEmail] = useState('');
  const [updateConsentType, setUpdateConsentType] = useState<'necessary' | 'all'>('necessary');
  const [updateLegalBasis, setUpdateLegalBasis] = useState<'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation' | 'other'>('consent');
  const [updateReason, setUpdateReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/gdpr/consents', window.location.origin);
      if (email.trim()) url.searchParams.set('email', email.trim());
      if (q.trim()) url.searchParams.set('q', q.trim());
      if (from.trim()) url.searchParams.set('from', from.trim());
      if (to.trim()) url.searchParams.set('to', to.trim());
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', '100');

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load consent events');
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea consent registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportUrl = useMemo(() => {
    const url = new URL('/api/admin/gdpr/consents/export', typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    if (email.trim()) url.searchParams.set('email', email.trim());
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (from.trim()) url.searchParams.set('from', from.trim());
    if (to.trim()) url.searchParams.set('to', to.trim());
    return url.toString();
  }, [email, q, from, to]);

  const canExport = useMemo(() => {
    return !!(email.trim() || q.trim() || from.trim() || to.trim());
  }, [email, q, from, to]);

  const submitUpdate = async () => {
    const e = updateEmail.trim();
    if (!e) {
      toast.error('Email este obligatoriu');
      return;
    }
    if (updateReason.trim().length < 3) {
      toast.error('Reason este obligatoriu (min 3 caractere)');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch('/api/admin/gdpr/consents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          consentType: updateConsentType,
          legalBasis: updateLegalBasis,
          reason: updateReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update consent');
      }

      toast.success('Consent actualizat');
      setUpdateReason('');
      await fetchRows();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Eroare la update');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper
        title="Consent Registry"
        description="Search and export append-only consent proof events. Update current consent preference with an audited reason."
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
            <CardTitle>Admin Update</CardTitle>
            <CardDescription>Sets current preference and appends a proof event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={updateEmail} onChange={(e) => setUpdateEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Consent Type</Label>
                <Input
                  value={updateConsentType}
                  onChange={(e) => setUpdateConsentType((e.target.value === 'all' ? 'all' : 'necessary') as any)}
                  placeholder="necessary | all"
                />
                <p className="text-xs text-muted-foreground">Tip: type 'necessary' or 'all'.</p>
              </div>
              <div className="space-y-2">
                <Label>Legal Basis</Label>
                <Input
                  value={updateLegalBasis}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setUpdateLegalBasis(v);
                  }}
                  placeholder="consent | legitimate_interest | contract | legal_obligation | other"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={updateReason} onChange={(e) => setUpdateReason(e.target.value)} placeholder="Why are you changing this?" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={submitUpdate} disabled={updating}>
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Saving...' : 'Save update'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Export requires at least one filter (email, q, from, to).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Email (exact match)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>q</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="domain / masked / policy" />
            </div>
            <div className="space-y-2">
              <Label>from (YYYY-MM-DD)</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-01-01" />
            </div>
            <div className="space-y-2">
              <Label>to (YYYY-MM-DD)</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-12-31" />
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-2">
              <Button onClick={fetchRows} disabled={loading}>
                Search
              </Button>
              <Button asChild variant="outline" disabled={!canExport}>
                <a href={exportUrl} aria-disabled={!canExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </a>
              </Button>
              {!canExport ? <span className="text-xs text-muted-foreground self-center">Add a filter to enable export.</span> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Showing up to 100 rows.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No consent events found.</div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="border rounded-md p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <div className="font-medium">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="text-muted-foreground">{r.emailMasked || r.emailHash}</div>
                      <div className="text-muted-foreground">{r.emailDomain || ''}</div>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="font-medium">{r.consentType}</span>
                      <span className="text-muted-foreground"> — {r.legalBasis} — {r.source}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      actor: {r.actorEmail || r.actorId || 'n/a'} {r.policyVersion ? `• policy ${r.policyVersion}` : ''}
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
