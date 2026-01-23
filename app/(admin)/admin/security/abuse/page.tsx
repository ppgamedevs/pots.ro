'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type AbuseResponse = {
  windowHours: number;
  since: string;
  total: number;
  topIps: Array<{ ip: string; count: number; lastSeen: string | null }>;
  topEmails: Array<{ emailMasked: string | null; domain: string | null; count: number; sampleId: string; lastSeen: string | null }>;
};

export default function AdminSecurityAbusePage() {
  const [windowHours, setWindowHours] = useState('24');
  const [data, setData] = useState<AbuseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [allowedIpsJson, setAllowedIpsJson] = useState('[]');
  const [blockedIpsJson, setBlockedIpsJson] = useState('[]');
  const [challengeIpsJson, setChallengeIpsJson] = useState('[]');
  const [blockedDomainsJson, setBlockedDomainsJson] = useState('[]');

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/abuse', window.location.origin);
      url.searchParams.set('windowHours', windowHours);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load abuse stats');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea statisticilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const settings = Array.isArray(json?.settings) ? json.settings : [];

        const getVal = (key: string) => settings.find((s: any) => s.key === key)?.value;

        const a = getVal('abuse.allowed_ips_json');
        const b = getVal('abuse.blocked_ips_json');
        const c = getVal('abuse.challenge_ips_json');
        const d = getVal('abuse.blocked_email_domains_json');

        if (typeof a === 'string') setAllowedIpsJson(a);
        if (typeof b === 'string') setBlockedIpsJson(b);
        if (typeof c === 'string') setChallengeIpsJson(c);
        if (typeof d === 'string') setBlockedDomainsJson(d);
      } catch {
        // non-blocking
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevealEmail = async (sampleId: string) => {
    const reason = window.prompt('Motiv pentru reveal (min 5 caractere):');
    if (!reason || reason.trim().length < 5) {
      toast.error('Motiv invalid');
      return;
    }

    try {
      const res = await fetch('/api/admin/pii/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'auth_audit',
          entityId: sampleId,
          fields: ['email'],
          reason: reason.trim(),
        }),
      });
      if (!res.ok) throw new Error('Reveal failed');
      const json = await res.json();
      const email = json?.revealed?.email;
      if (email) {
        setRevealed((prev) => ({ ...prev, [sampleId]: String(email) }));
        toast.success('Email revealed (timeboxed)');
      }
    } catch (e) {
      console.error(e);
      toast.error('Eroare la reveal');
    }
  };

  const saveDangerousSetting = async (key: string, value: any, description: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'set',
        key,
        value,
        description,
        confirmDangerous: true,
      }),
    });
    if (!res.ok) throw new Error('Failed to save setting');
  };

  const handleSaveLists = async () => {
    try {
      setIsSaving(true);
      const allowedIps = JSON.parse(allowedIpsJson);
      const blockedIps = JSON.parse(blockedIpsJson);
      const challengeIps = JSON.parse(challengeIpsJson);
      const blockedDomains = JSON.parse(blockedDomainsJson);

      if (!Array.isArray(allowedIps) || !Array.isArray(blockedIps) || !Array.isArray(challengeIps) || !Array.isArray(blockedDomains)) {
        toast.error('Toate valorile trebuie să fie JSON arrays');
        return;
      }

      await Promise.all([
        saveDangerousSetting('abuse.allowed_ips_json', allowedIps, 'Allowlist IPs bypassing rate limiting'),
        saveDangerousSetting('abuse.blocked_ips_json', blockedIps, 'Blocked IPs (immediate rate-limit response)'),
        saveDangerousSetting('abuse.challenge_ips_json', challengeIps, 'Challenge IPs (stricter limits + jitter)'),
        saveDangerousSetting('abuse.blocked_email_domains_json', blockedDomains, 'Blocked email domains for OTP/login flows'),
      ]);

      toast.success('Abuse lists salvate');
      await fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Eroare la salvare');
    } finally {
      setIsSaving(false);
    }
  };

  const sinceLabel = useMemo(() => {
    if (!data?.since) return '';
    return new Date(data.since).toLocaleString();
  }, [data?.since]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Abuse / Rate Limiting</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated auth rate-limit events. Emails are masked by default.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Window (hours)</span>
            <Input className="w-[90px]" value={windowHours} onChange={(e) => setWindowHours(e.target.value)} />
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>{data ? `Since ${sinceLabel}` : '—'}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : data ? (
            <div className="text-sm">Total rate-limit events: <span className="font-medium">{data.total}</span></div>
          ) : (
            <div className="text-sm text-muted-foreground">No data.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Policy (Dangerous)</CardTitle>
            <CardDescription>Allow/block/challenge lists are audited. Use sparingly to avoid blocking legit users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Allowed IPs (JSON array)</div>
              <textarea className="w-full min-h-[68px] rounded-md border px-3 py-2 text-sm" value={allowedIpsJson} onChange={(e) => setAllowedIpsJson(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Blocked IPs (JSON array)</div>
              <textarea className="w-full min-h-[68px] rounded-md border px-3 py-2 text-sm" value={blockedIpsJson} onChange={(e) => setBlockedIpsJson(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Challenge IPs (JSON array)</div>
              <textarea className="w-full min-h-[68px] rounded-md border px-3 py-2 text-sm" value={challengeIpsJson} onChange={(e) => setChallengeIpsJson(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Blocked email domains (JSON array)</div>
              <textarea className="w-full min-h-[68px] rounded-md border px-3 py-2 text-sm" value={blockedDomainsJson} onChange={(e) => setBlockedDomainsJson(e.target.value)} />
            </div>
            <div>
              <Button onClick={handleSaveLists} disabled={isSaving}>
                {isSaving ? 'Se salvează...' : 'Salvează policy'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top IPs</CardTitle>
            <CardDescription>Most frequent rate-limited IPs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : !data || data.topIps.length === 0 ? (
              <div className="text-sm text-muted-foreground">No entries.</div>
            ) : (
              <div className="space-y-2">
                {data.topIps.slice(0, 20).map((r) => (
                  <div key={r.ip} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div className="font-mono">{r.ip}</div>
                    <div className="text-muted-foreground">{r.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Emails</CardTitle>
            <CardDescription>Masked by default; reveal requires a reason (logged)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : !data || data.topEmails.length === 0 ? (
              <div className="text-sm text-muted-foreground">No entries.</div>
            ) : (
              <div className="space-y-2">
                {data.topEmails.slice(0, 20).map((r) => (
                  <div key={r.sampleId} className="border rounded-md p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-mono">{revealed[r.sampleId] || r.emailMasked || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.domain || ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">{r.count}</div>
                        <Button size="sm" variant="outline" onClick={() => handleRevealEmail(r.sampleId)}>
                          Reveal
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
