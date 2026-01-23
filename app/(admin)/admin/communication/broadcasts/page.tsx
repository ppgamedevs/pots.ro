'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import {
  createBroadcast,
  listBroadcasts,
  type BroadcastKind,
  type BroadcastRow,
  type BroadcastStatus,
} from '@/lib/api/communication';

const statusOptions: Array<BroadcastStatus | 'all'> = [
  'all',
  'draft',
  'pending_approval',
  'approved',
  'scheduled',
  'sending',
  'sent',
  'cancelled',
  'rejected',
  'failed',
];

export default function AdminCommunicationBroadcastsPage() {
  const [rows, setRows] = useState<BroadcastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [status, setStatus] = useState<string>('all');

  // create form
  const [kind, setKind] = useState<BroadcastKind>('announcement');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [html, setHtml] = useState<string>('<div style="font-family:system-ui">\n  <h1>Salut!</h1>\n  <p>Mesajul tău aici.</p>\n</div>');
  const [segmentJson, setSegmentJson] = useState<string>(() => JSON.stringify({ roles: ['buyer', 'seller'], requireEmailNotifications: true }, null, 2));

  const filters = useMemo(() => {
    return { status: status === 'all' ? undefined : status };
  }, [status]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listBroadcasts(filters);
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

  const submitCreate = async () => {
    if (name.trim().length < 3) return toast.error('Nume invalid');
    if (subject.trim().length < 3) return toast.error('Subiect invalid');
    if (html.trim().length < 20) return toast.error('HTML prea scurt');

    let segment: any = undefined;
    if (kind === 'marketing') {
      try {
        segment = JSON.parse(segmentJson);
      } catch {
        return toast.error('Segment JSON invalid');
      }
      if (!segment) return toast.error('Marketing broadcasts require a segment');
    } else {
      // Optional for non-marketing.
      try {
        segment = segmentJson.trim() ? JSON.parse(segmentJson) : undefined;
      } catch {
        // ignore if not valid and empty-ish
        segment = undefined;
      }
    }

    try {
      setBusy('create');
      const res = await createBroadcast({
        kind,
        name: name.trim(),
        subject: subject.trim(),
        html,
        fromEmail: fromEmail.trim() || undefined,
        segment,
      });
      if (!res.ok || !res.data) throw new Error(res.error || 'Create failed');
      toast.success('Broadcast creat (draft)');
      setName('');
      setSubject('');
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
      title="Broadcasts"
      description="Creează draft → Request approval → Approve (2-person pentru marketing) → Schedule. Sender-ul rulează din cron."
      customBreadcrumbLabel="Broadcasts"
    >
      <Card>
        <CardHeader>
          <CardTitle>Creează broadcast</CardTitle>
          <CardDescription>
            Pentru marketing: segmentul e obligatoriu (JSON). Pentru system/announcement e optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tip</label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger><SelectValue placeholder="Kind" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">system</SelectItem>
                  <SelectItem value="announcement">announcement</SelectItem>
                  <SelectItem value="marketing">marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From (optional)</label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder='ex: "FloristMarket <no-reply@pots.ro>"' />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nume</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Anunț mentenanță" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subiect</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subiect email" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">HTML</label>
            <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Segment (JSON)</label>
            <Textarea value={segmentJson} onChange={(e) => setSegmentJson(e.target.value)} rows={6} />
            <p className="text-xs text-muted-foreground">
              Exemplu:{' '}
              <span className="font-mono">{'{"roles":["buyer"],"requireEmailNotifications":true,"requirePromotionsOptIn":true}'}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            <Button onClick={submitCreate} disabled={busy === 'create'}>
              {busy === 'create' ? 'Saving…' : 'Create (draft)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Broadcasts</CardTitle>
          <CardDescription>{loading ? 'Se încarcă…' : `${rows.length} rezultate`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Created</TableHead>
                  <TableHead scope="col">Kind</TableHead>
                  <TableHead scope="col">Name</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Scheduled</TableHead>
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
                      <TableCell>{fmt(r.createdAt || null)}</TableCell>
                      <TableCell>{r.kind}</TableCell>
                      <TableCell className="max-w-[380px] truncate">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.subject}</div>
                      </TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{fmt(r.scheduledAt || null)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/communication/broadcasts/${r.id}`}>
                            <Button size="sm" variant="outline">Open</Button>
                          </Link>
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
