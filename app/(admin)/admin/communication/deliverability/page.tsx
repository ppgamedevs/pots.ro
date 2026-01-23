'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { getDeliverability, type DeliverabilityDashboard } from '@/lib/api/communication';

export default function AdminDeliverabilityPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [windowDays, setWindowDays] = useState<string>('14');
  const [data, setData] = useState<DeliverabilityDashboard | null>(null);

  const windowDaysNum = useMemo(() => {
    const n = Number(windowDays);
    return Number.isFinite(n) ? n : 14;
  }, [windowDays]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getDeliverability(windowDaysNum);
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to load');
      setData(res.data);
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowDaysNum]);

  const pct = (x: number) => `${(x * 100).toFixed(2)}%`;

  return (
    <AdminPageWrapper
      title="Deliverability"
      description="Bounces/complaints/open/click signals from Resend webhooks + suppression summary."
      backButtonHref="/admin/communication"
      customBreadcrumbLabel="Deliverability"
    >
      <Card>
        <CardHeader>
          <CardTitle>Window</CardTitle>
          <CardDescription>Adjust the aggregation window (days)</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 items-center">
          <Select value={windowDays} onValueChange={setWindowDays}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Days" /></SelectTrigger>
            <SelectContent>
              {[7, 14, 30, 60, 90].map((d) => (
                <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={busy || loading}
            onClick={async () => {
              try {
                setBusy(true);
                await load();
              } finally {
                setBusy(false);
              }
            }}
          >
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground">Since: {data?.since ? new Date(data.since).toLocaleString('ro-RO') : '-'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>{loading ? 'Loading…' : 'Counts and rates'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded border bg-white">
            <div className="text-sm text-muted-foreground">Attempted</div>
            <div className="text-2xl font-semibold">{data?.rates?.attempted ?? 0}</div>
          </div>
          <div className="p-4 rounded border bg-white">
            <div className="text-sm text-muted-foreground">Bounce rate</div>
            <div className="text-2xl font-semibold">{pct(data?.rates?.bounceRate ?? 0)}</div>
          </div>
          <div className="p-4 rounded border bg-white">
            <div className="text-sm text-muted-foreground">Complaint rate</div>
            <div className="text-2xl font-semibold">{pct(data?.rates?.complaintRate ?? 0)}</div>
          </div>
          <div className="p-4 rounded border bg-white md:col-span-3">
            <div className="text-sm text-muted-foreground">Suppressions</div>
            <div className="text-base">Active: <b>{data?.suppressions?.active ?? 0}</b> · Total: <b>{data?.suppressions?.total ?? 0}</b></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Counts by event</CardTitle>
          <CardDescription>Raw event totals within window</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Event</TableHead>
                  <TableHead scope="col">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data?.counts || {}).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-slate-500">No data</TableCell>
                  </TableRow>
                ) : (
                  Object.entries(data?.counts || {}).map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell>{k}</TableCell>
                      <TableCell>{v}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily breakdown</CardTitle>
          <CardDescription>For quick trend checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Day</TableHead>
                  <TableHead scope="col">Event</TableHead>
                  <TableHead scope="col">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.daily || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-slate-500">No data</TableCell>
                  </TableRow>
                ) : (
                  (data?.daily || []).slice(-60).map((r, idx) => (
                    <TableRow key={`${r.day}-${r.eventType}-${idx}`}>
                      <TableCell>{r.day}</TableCell>
                      <TableCell>{r.eventType}</TableCell>
                      <TableCell>{r.count}</TableCell>
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
