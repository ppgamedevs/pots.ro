'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  approveBroadcast,
  cancelBroadcast,
  getBroadcast,
  previewSegment,
  rejectBroadcast,
  requestBroadcastApproval,
  scheduleBroadcast,
  updateBroadcast,
  type BroadcastRow,
} from '@/lib/api/communication';

export default function AdminBroadcastDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [row, setRow] = useState<BroadcastRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [html, setHtml] = useState('');
  const [segmentJson, setSegmentJson] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  const isDraft = row?.status === 'draft';

  const load = async () => {
    try {
      setLoading(true);
      const res = await getBroadcast(id);
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to load');
      const r = (res.data as any).row as BroadcastRow;
      setRow(r);
      setName(r.name || '');
      setSubject(r.subject || '');
      setFromEmail((r.fromEmail as any) || '');
      setHtml((r.html as any) || '');
      setSegmentJson(r.segment ? JSON.stringify(r.segment, null, 2) : '');
      setScheduledAt(r.scheduledAt ? new Date(r.scheduledAt).toISOString().slice(0, 16) : '');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString('ro-RO') : '-');

  const segmentParsed = useMemo(() => {
    try {
      return segmentJson.trim() ? JSON.parse(segmentJson) : null;
    } catch {
      return null;
    }
  }, [segmentJson]);

  const save = async () => {
    if (!isDraft) return toast.error('Only draft broadcasts can be edited');
    if (name.trim().length < 3) return toast.error('Nume invalid');
    if (subject.trim().length < 3) return toast.error('Subiect invalid');
    if (html.trim().length < 20) return toast.error('HTML prea scurt');

    let segment: any = undefined;
    if (segmentJson.trim()) {
      try {
        segment = JSON.parse(segmentJson);
      } catch {
        return toast.error('Segment JSON invalid');
      }
    }

    try {
      setBusy('save');
      const res = await updateBroadcast(id, {
        name: name.trim(),
        subject: subject.trim(),
        fromEmail: fromEmail.trim() || null,
        html,
        segment,
      } as any);
      if (!res.ok) throw new Error(res.error || 'Save failed');
      toast.success('Saved');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const requestApproval = async () => {
    try {
      setBusy('request');
      const res = await requestBroadcastApproval(id);
      if (!res.ok) throw new Error(res.error || 'Request failed');
      toast.success('Sent for approval');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    try {
      setBusy('approve');
      const res = await approveBroadcast(id);
      if (!res.ok) throw new Error(res.error || 'Approve failed');
      toast.success('Approved');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if ((rejectReason || '').trim().length < 3) {
      toast.error('Reject reason must be at least 3 characters');
      return;
    }
    try {
      setBusy('reject');
      const res = await rejectBroadcast(id, { reason: rejectReason });
      if (!res.ok) throw new Error(res.error || 'Reject failed');
      toast.success('Rejected');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const schedule = async () => {
    try {
      setBusy('schedule');
      const iso = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      const res = await scheduleBroadcast(id, iso ? { scheduledAt: iso } : {});
      if (!res.ok) throw new Error(res.error || 'Schedule failed');
      toast.success('Scheduled');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    try {
      setBusy('cancel');
      const res = await cancelBroadcast(id);
      if (!res.ok) throw new Error(res.error || 'Cancel failed');
      toast.success('Cancelled');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  const runPreview = async () => {
    try {
      setBusy('preview');
      const seg = segmentParsed || {};
      const roles = Array.isArray(seg.roles) ? seg.roles : ['buyer', 'seller'];
      const res = await previewSegment({
        roles,
        requireEmailNotifications: seg.requireEmailNotifications ?? true,
        requirePromotionsOptIn: seg.requirePromotionsOptIn ?? false,
        requireNewsletterOptIn: seg.requireNewsletterOptIn ?? false,
      } as any);
      if (!res.ok || !res.data) throw new Error(res.error || 'Preview failed');
      const counts = (res.data as any).counts;
      toast.success(`Preview: ~${counts?.estimatedRecipients ?? '?'} recipients`);
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminPageWrapper
      title="Broadcast"
      description={loading ? 'Loading…' : `Status: ${row?.status || '-'}`}
      backButtonHref="/admin/communication/broadcasts"
      customBreadcrumbLabel="Broadcast"
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Fields are editable only while status is draft.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isDraft} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!isDraft} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">From</label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} disabled={!isDraft} placeholder='optional override' />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">HTML</label>
            <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} disabled={!isDraft} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Segment (JSON)</label>
            <Textarea value={segmentJson} onChange={(e) => setSegmentJson(e.target.value)} rows={6} disabled={!isDraft} />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            <Button onClick={runPreview} disabled={busy === 'preview'} variant="outline">
              {busy === 'preview' ? '…' : 'Preview segment'}
            </Button>
            <Button onClick={save} disabled={!isDraft || busy === 'save'}>
              {busy === 'save' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            draft → pending_approval → approved → scheduled. Marketing requires 2-person approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Kind</div>
              <div className="font-medium">{row?.kind || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">{fmt(row?.createdAt || null)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="font-medium">{fmt(row?.approvedAt || null)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={requestApproval} disabled={busy === 'request'}>
              {busy === 'request' ? '…' : 'Request approval'}
            </Button>
            <Button onClick={approve} disabled={busy === 'approve'} variant="outline">
              {busy === 'approve' ? '…' : 'Approve'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Scheduled at (optional)</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                placeholder=""
              />
              <p className="text-xs text-muted-foreground">If empty, scheduling uses now.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={schedule} disabled={busy === 'schedule'}>
                {busy === 'schedule' ? '…' : 'Schedule'}
              </Button>
              <Button onClick={cancel} disabled={busy === 'cancel'} variant="destructive">
                {busy === 'cancel' ? '…' : 'Cancel'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Reject reason</label>
              <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="optional" />
            </div>
            <div className="flex gap-2">
              <Button onClick={reject} disabled={busy === 'reject'} variant="outline">
                {busy === 'reject' ? '…' : 'Reject'}
              </Button>
            </div>
          </div>

          {row?.rejectionReason ? (
            <div className="text-sm text-red-700">Rejected: {row.rejectionReason}</div>
          ) : null}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
