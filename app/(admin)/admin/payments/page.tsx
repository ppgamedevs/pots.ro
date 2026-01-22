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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/money';

type PaymentRow = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalCents: number;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
};

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [markPaidReason, setMarkPaidReason] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('page', '1');
    sp.set('pageSize', '50');
    if (status && status !== 'all') sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    return sp.toString();
  }, [status, q, from, to]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payments?${query}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setRows(json.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const reconcile = async (orderId: string) => {
    try {
      setBusy(orderId);
      const res = await fetch(`/api/admin/payments/${orderId}/reconcile`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Reconcile failed');
      toast.success(json.applied ? 'Reconciled (applied)' : 'Reconciled (no changes)');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const submitMarkPaid = async () => {
    if (!activeOrderId) return;
    try {
      setBusy(activeOrderId);
      const res = await fetch(`/api/admin/payments/${activeOrderId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: markPaidReason }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Mark paid failed');
      toast.success('Marked as paid');
      setMarkPaidReason('');
      setActiveOrderId(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const maskRef = (ref: string | null) => {
    if (!ref) return '-';
    if (ref.length <= 8) return ref;
    return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
  };

  return (
    <AdminPageWrapper title="Payments (Netopia)" description="Tranzacții (din comenzi) + acțiuni minime: reconcile și mark-as-paid (exception).">
      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Netopia-only. Caută după order number / id / payment ref.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <Input className="w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
          <Input className="w-40" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input className="w-40" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plăți</CardTitle>
          <CardDescription>{loading ? 'Se încarcă…' : `${rows.length} rezultate`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Data</TableHead>
                  <TableHead scope="col">Comandă</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Sumă</TableHead>
                  <TableHead scope="col">Provider ref</TableHead>
                  <TableHead scope="col">Acțiuni</TableHead>
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
                      <TableCell>{new Date(r.createdAt).toLocaleString('ro-RO')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link className="underline" href={`/admin/orders/${r.id}`}>{r.orderNumber}</Link>
                          <span className="text-xs text-slate-500">({r.id.slice(-8)})</span>
                        </div>
                      </TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{formatCurrency((r.totalCents || 0) / 100, r.currency || 'RON')}</TableCell>
                      <TableCell>{maskRef(r.paymentRef)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reconcile(r.id)}
                            disabled={busy === r.id}
                          >
                            {busy === r.id ? '…' : 'Reconcile'}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setActiveOrderId(r.id)}
                              >
                                Mark as paid
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark as paid (exception)</DialogTitle>
                                <DialogDescription>Strict: requires reason and is audited.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3">
                                <Textarea value={markPaidReason} onChange={(e) => setMarkPaidReason(e.target.value)} rows={5} placeholder="Reason…" />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => { setActiveOrderId(null); setMarkPaidReason(''); }}>Cancel</Button>
                                  <Button onClick={submitMarkPaid} disabled={!markPaidReason.trim() || busy === r.id}>
                                    {busy === r.id ? 'Saving…' : 'Confirm'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
