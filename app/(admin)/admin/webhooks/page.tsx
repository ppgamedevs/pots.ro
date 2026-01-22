'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type WebhookLogRow = {
  id: string;
  source: string;
  ref: string | null;
  result: 'ok' | 'duplicate' | 'error' | null;
  payload: any;
  createdAt: string;
};

export default function AdminWebhooksPage() {
  const [rows, setRows] = useState<WebhookLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [ref, setRef] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [escalateId, setEscalateId] = useState<string | null>(null);
  const [escalateNote, setEscalateNote] = useState<string>('');

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('page', '1');
    sp.set('pageSize', '50');
    if (source) sp.set('source', source);
    if (result) sp.set('result', result);
    if (ref.trim()) sp.set('ref', ref.trim());
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    return sp.toString();
  }, [source, result, ref, from, to]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/webhooks?${query}`, { credentials: 'include' });
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

  const replay = async (id: string) => {
    try {
      setBusyId(id);
      const res = await fetch(`/api/admin/webhooks/${id}/replay`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Replay failed');
      toast.success(json.applied ? 'Replay applied' : 'Replay done (no changes)');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusyId(null);
    }
  };

  const markDuplicate = async (id: string) => {
    try {
      setBusyId(id);
      const res = await fetch(`/api/admin/webhooks/${id}/mark-duplicate`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      toast.success('Marked duplicate');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusyId(null);
    }
  };

  const submitEscalate = async () => {
    if (!escalateId) return;
    try {
      setBusyId(escalateId);
      const res = await fetch(`/api/admin/webhooks/${escalateId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: escalateNote }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Escalate failed');
      toast.success('Escalated');
      setEscalateId(null);
      setEscalateNote('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusyId(null);
    }
  };

  const hasError = (payload: any) => {
    const err = payload?.error || payload?.callback?.error;
    return !!err;
  };

  return (
    <AdminPageWrapper title="Webhook events" description="Evenimente din webhook_logs (payload redacted), cu replay/duplicate/escalate.">
      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Rezultate: ok / duplicate / error.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toate</SelectItem>
              <SelectItem value="payments">payments</SelectItem>
              <SelectItem value="orders">orders</SelectItem>
              <SelectItem value="shipping">shipping</SelectItem>
              <SelectItem value="invoices">invoices</SelectItem>
              <SelectItem value="refunds">refunds</SelectItem>
              <SelectItem value="payouts">payouts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Result" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toate</SelectItem>
              <SelectItem value="ok">ok</SelectItem>
              <SelectItem value="duplicate">duplicate</SelectItem>
              <SelectItem value="error">error</SelectItem>
            </SelectContent>
          </Select>
          <Input className="w-56" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ref…" />
          <Input className="w-40" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input className="w-40" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>{loading ? 'Se încarcă…' : `${rows.length} rezultate`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Data</TableHead>
                  <TableHead scope="col">Source</TableHead>
                  <TableHead scope="col">Ref</TableHead>
                  <TableHead scope="col">Result</TableHead>
                  <TableHead scope="col">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">No data</TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.createdAt).toLocaleString('ro-RO')}</TableCell>
                      <TableCell>{r.source}</TableCell>
                      <TableCell>{r.ref || '-'}</TableCell>
                      <TableCell>
                        <span className={r.result === 'error' || hasError(r.payload) ? 'text-red-600' : r.result === 'duplicate' ? 'text-amber-700' : 'text-green-700'}>
                          {r.result || 'ok'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">View</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Payload (redacted)</DialogTitle>
                                <DialogDescription>{r.id}</DialogDescription>
                              </DialogHeader>
                              <pre className="text-xs p-3 rounded bg-slate-950 text-slate-100 overflow-auto max-h-[60vh]">
                                {JSON.stringify(r.payload, null, 2)}
                              </pre>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" variant="outline" onClick={() => replay(r.id)} disabled={busyId === r.id}>
                            {busyId === r.id ? '…' : 'Replay'}
                          </Button>

                          <Button size="sm" variant="secondary" onClick={() => markDuplicate(r.id)} disabled={busyId === r.id}>
                            Duplicate
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setEscalateId(r.id)} disabled={busyId === r.id}>Escalate</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Escalate</DialogTitle>
                                <DialogDescription>Trimite alertă pe ADMIN_EMAILS + audit.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3">
                                <Textarea value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)} rows={5} placeholder="Note…" />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => { setEscalateId(null); setEscalateNote(''); }}>Cancel</Button>
                                  <Button onClick={submitEscalate} disabled={!escalateNote.trim() || busyId === (escalateId || '')}>
                                    {busyId === (escalateId || '') ? 'Sending…' : 'Send'}
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
