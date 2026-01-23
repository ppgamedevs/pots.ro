'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { approveCommissionRate, createCommissionRate, listCommissionRates, type CommissionRateRow } from '@/lib/api/commissions';

export default function AdminCommissionsPage() {
  const [rows, setRows] = useState<CommissionRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [status, setStatus] = useState<string>('pending');
  const [targetMode, setTargetMode] = useState<'default' | 'seller'>('default');
  const [sellerIdInput, setSellerIdInput] = useState<string>('');

  // create form
  const [pct, setPct] = useState<string>('10');
  const [effectiveAt, setEffectiveAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  const filters = useMemo(() => {
    return {
      sellerId: targetMode === 'default' ? 'default' : sellerIdInput.trim(),
      status: status === 'all' ? '' : status,
    };
  }, [targetMode, sellerIdInput, status]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listCommissionRates({
        sellerId: filters.sellerId || undefined,
        status: filters.status || undefined,
      });
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to load');
      setRows((res.data as any).data || []);
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

  const pctBps = useMemo(() => {
    const n = Number(pct);
    if (!Number.isFinite(n) || n <= 0 || n > 100) return null;
    return Math.round(n * 100);
  }, [pct]);

  const submitCreate = async () => {
    if (!pctBps) {
      toast.error('Procent invalid');
      return;
    }
    if (!effectiveAt) {
      toast.error('effectiveAt este obligatoriu');
      return;
    }

    try {
      setBusyId('create');
      const payload = {
        sellerId: targetMode === 'default' ? null : sellerIdInput.trim(),
        pctBps,
        effectiveAt: new Date(`${effectiveAt}T00:00:00.000Z`).toISOString(),
        note: note.trim() || undefined,
      };
      const res = await createCommissionRate(payload);
      if (!res.ok) throw new Error(res.error || 'Create failed');
      toast.success('Schimbare comision creată (pending)');
      setNote('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (id: string) => {
    try {
      setBusyId(id);
      const res = await approveCommissionRate(id);
      if (!res.ok) throw new Error(res.error || 'Approve failed');
      toast.success('Aprobat');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusyId(null);
    }
  };

  const labelSeller = (row: CommissionRateRow) => (row.sellerId ? row.sellerId.slice(-8) : 'default');

  return (
    <AdminPageWrapper
      title="Comisioane"
      description="Schimbări versionate (effective date) + aprobare 2-person. Checkout folosește doar ratele approved."
      customBreadcrumbLabel="Comisioane"
    >
      <Card>
        <CardHeader>
          <CardTitle>Creează schimbare</CardTitle>
          <CardDescription>
            Pasul 1: creează (pending). Pasul 2: alt admin apasă Approve.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target</label>
            <Select value={targetMode} onValueChange={(v) => setTargetMode(v as any)}>
              <SelectTrigger><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (platform)</SelectItem>
                <SelectItem value="seller">Seller specific (introdu id)</SelectItem>
              </SelectContent>
            </Select>
            {targetMode !== 'default' && (
              <Input
                value={sellerIdInput}
                onChange={(e) => setSellerIdInput(e.target.value)}
                placeholder="sellerId (uuid)"
              />
            )}
            <p className="text-xs text-slate-500">Default rate = sellerId NULL</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Procent (%)</label>
            <Input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="ex: 10" />
            <p className="text-xs text-slate-500">Stored as basis points: {pctBps ?? '-'} bps</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Effective date</label>
            <Input type="date" value={effectiveAt} onChange={(e) => setEffectiveAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Motiv / ticket / detalii…" />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Link href="/admin/finante" className="text-sm underline self-center mr-auto">Back to Finanțe</Link>
            <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            <Button onClick={submitCreate} disabled={busyId === 'create'}>
              {busyId === 'create' ? 'Saving…' : 'Create (pending)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schimbări</CardTitle>
          <CardDescription>{loading ? 'Se încarcă…' : `${rows.length} rezultate`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="approved">approved</SelectItem>
                <SelectItem value="all">all</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Created</TableHead>
                  <TableHead scope="col">Target</TableHead>
                  <TableHead scope="col">Rate</TableHead>
                  <TableHead scope="col">Effective</TableHead>
                  <TableHead scope="col">Status</TableHead>
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
                    <TableRow key={r.id}>
                      <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleString('ro-RO') : '-'}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">{labelSeller(r)}</span>
                      </TableCell>
                      <TableCell>{(Number(r.pctBps) / 100).toFixed(2)}%</TableCell>
                      <TableCell>{r.effectiveAt ? new Date(r.effectiveAt).toISOString().split('T')[0] : '-'}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {r.status === 'pending' ? (
                            <Button size="sm" onClick={() => approve(r.id)} disabled={busyId === r.id}>
                              {busyId === r.id ? '…' : 'Approve'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              -
                            </Button>
                          )}
                        </div>
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
