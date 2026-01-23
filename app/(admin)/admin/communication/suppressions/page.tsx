'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
  addSuppression,
  listSuppressions,
  revokeSuppression,
  type SuppressionRow,
} from '@/lib/api/communication';

export default function AdminSuppressionsPage() {
  const [rows, setRows] = useState<SuppressionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [activeOnly, setActiveOnly] = useState<'all' | 'active'>('active');

  // add form
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<SuppressionRow['reason']>('manual');
  const [note, setNote] = useState('');

  const filters = useMemo(() => {
    return {
      q: q.trim() || undefined,
      active: activeOnly === 'active',
    };
  }, [q, activeOnly]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listSuppressions(filters);
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to load');
      setRows((res.data as any).rows || []);
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const submitAdd = async () => {
    if (!email.trim()) return toast.error('Email required');

    try {
      setBusy('add');
      const res = await addSuppression({ email: email.trim(), reason, note: note.trim() || undefined });
      if (!res.ok) throw new Error(res.error || 'Add failed');
      toast.success('Added/updated');
      setEmail('');
      setNote('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (emailToRevoke: string) => {
    try {
      setBusy(emailToRevoke);
      const res = await revokeSuppression({ email: emailToRevoke, note: 'revoked_by_admin' });
      if (!res.ok) throw new Error(res.error || 'Revoke failed');
      toast.success('Revoked');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString('ro-RO') : '-');

  return (
    <AdminPageWrapper
      title="Suppressions"
      description="Listă de email-uri pentru care nu trimitem (bounce/complaint/manual/unsubscribe)."
      backButtonHref="/admin/communication"
      customBreadcrumbLabel="Suppressions"
    >
      <Card>
        <CardHeader>
          <CardTitle>Add suppression</CardTitle>
          <CardDescription>Manual override (takes precedence over sending).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Select value={reason} onValueChange={(v) => setReason(v as any)}>
              <SelectTrigger><SelectValue placeholder="reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="unsubscribe">unsubscribe</SelectItem>
                <SelectItem value="bounce">bounce</SelectItem>
                <SelectItem value="complaint">complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why / ticket" />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            <Button onClick={submitAdd} disabled={busy === 'add'}>
              {busy === 'add' ? 'Saving…' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
          <CardDescription>{loading ? 'Se încarcă…' : `${rows.length} rezultate`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" className="w-72" />
            <Select value={activeOnly} onValueChange={(v) => setActiveOnly(v as any)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Active" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active only</SelectItem>
                <SelectItem value="all">all</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Email</TableHead>
                  <TableHead scope="col">Reason</TableHead>
                  <TableHead scope="col">Source</TableHead>
                  <TableHead scope="col">Updated</TableHead>
                  <TableHead scope="col">Revoked</TableHead>
                  <TableHead scope="col">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">No data</TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.email}>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>{r.reason}</TableCell>
                      <TableCell>{r.source}</TableCell>
                      <TableCell>{fmt(r.updatedAt)}</TableCell>
                      <TableCell>{fmt(r.revokedAt)}</TableCell>
                      <TableCell>
                        {r.revokedAt ? (
                          <Button size="sm" variant="outline" disabled>-</Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => revoke(r.email)} disabled={busy === r.email}>
                            {busy === r.email ? '…' : 'Revoke'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
