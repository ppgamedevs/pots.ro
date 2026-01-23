'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

interface Setting {
  key: string;
  value: string;
  stagedValue?: string | null;
  stagedEffectiveAt?: string | null;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
  dangerous?: boolean;
}

type FeatureFlag = {
  key: string;
  enabled: boolean;
  rolloutPct: number;
  segments?: any;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shippingFee, setShippingFee] = useState('19.99');
  const [freeThreshold, setFreeThreshold] = useState('0.00');
  const [adminEmailsJson, setAdminEmailsJson] = useState('["ops@floristmarket.ro"]');
  const [killSwitch, setKillSwitch] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState('');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const [settingsResp, flagsResp] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/feature-flags'),
      ]);
      
      if (!settingsResp.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await settingsResp.json();
      setSettings(data.settings);

      if (flagsResp.ok) {
        const f = await flagsResp.json();
        setFlags(Array.isArray(f.flags) ? f.flags : []);
      }

      // Find shipping settings
      const shippingFeeSetting = data.settings.find((s: Setting) => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents');
      if (shippingFeeSetting) {
        setShippingFee((parseInt(shippingFeeSetting.value) / 100).toFixed(2));
      }

      const freeThresholdSetting = data.settings.find((s: Setting) => s.key === 'shipping.free_threshold_cents');
      if (freeThresholdSetting) {
        setFreeThreshold((parseInt(freeThresholdSetting.value) / 100).toFixed(2));
      }

      const adminEmailsSetting = data.settings.find((s: Setting) => s.key === 'notifications.admin_emails_json');
      if (adminEmailsSetting?.value) {
        setAdminEmailsJson(adminEmailsSetting.value);
      }

      const killSwitchSetting = data.settings.find((s: Setting) => s.key === 'feature_flags.global_kill_switch');
      if (killSwitchSetting?.value) {
        setKillSwitch(killSwitchSetting.value === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Eroare la încărcarea setărilor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveShippingFee = async () => {
    try {
      setIsSaving(true);
      const feeCents = Math.round(parseFloat(shippingFee) * 100);
      const thresholdCents = Math.round(parseFloat(freeThreshold) * 100);

      if (isNaN(feeCents) || feeCents < 0) {
        toast.error('Valoare invalidă. Introdu un număr pozitiv.');
        return;
      }

      if (isNaN(thresholdCents) || thresholdCents < 0) {
        toast.error('Pragul de livrare gratuită este invalid.');
        return;
      }

      const response1 = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'set',
          key: 'shipping.base_fee_cents',
          value: feeCents,
          description: 'Base shipping fee in cents (RON)',
        }),
      });

      if (!response1.ok) {
        throw new Error('Failed to save setting');
      }

      const response2 = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'set',
          key: 'shipping.free_threshold_cents',
          value: thresholdCents,
          description: 'Free shipping threshold in cents (RON)',
        }),
      });

      if (!response2.ok) {
        throw new Error('Failed to save setting');
      }

      toast.success('Tariful de transport a fost actualizat!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving shipping fee:', error);
      toast.error('Eroare la salvarea setării');
    } finally {
      setIsSaving(false);
    }
  };

  const saveDangerousSetting = async (key: string, value: any, description?: string) => {
    const resp = await fetch('/api/admin/settings', {
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
    if (!resp.ok) throw new Error('Failed to save setting');
  };

  const handleSaveAdminEmails = async () => {
    try {
      setIsSaving(true);
      const parsed = JSON.parse(adminEmailsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('Introdu un JSON array cu cel puțin un email');
        return;
      }

      await saveDangerousSetting(
        'notifications.admin_emails_json',
        parsed,
        'Admin alert recipients as JSON array of emails'
      );
      toast.success('Destinatarii alertelor au fost actualizați');
      await loadSettings();
    } catch (e) {
      console.error(e);
      toast.error('Eroare la salvarea destinatariilor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKillSwitch = async () => {
    try {
      setIsSaving(true);
      await saveDangerousSetting(
        'feature_flags.global_kill_switch',
        killSwitch,
        'Emergency kill switch for feature flags'
      );
      toast.success('Kill switch salvat');
      await loadSettings();
    } catch (e) {
      console.error(e);
      toast.error('Eroare la salvarea kill switch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpsertFlag = async (flag: FeatureFlag) => {
    try {
      setIsSaving(true);
      const resp = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: !!flag.enabled,
          rolloutPct: Math.max(0, Math.min(100, Number(flag.rolloutPct || 0))),
        }),
      });
      if (!resp.ok) throw new Error('Failed to update flag');
      toast.success('Flag salvat');
      await loadSettings();
    } catch (e) {
      console.error(e);
      toast.error('Eroare la salvarea flag-ului');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFlag = async () => {
    const key = newFlagKey.trim();
    if (!key) {
      toast.error('Cheia flag-ului este obligatorie');
      return;
    }
    await handleUpsertFlag({ key, enabled: false, rolloutPct: 0 });
    setNewFlagKey('');
  };

  return (
    <div className="space-y-8">
      <AdminPageWrapper 
        title="Setări Magazin"
        description="Configurează setările generale ale magazinului"
      >
        <div className="flex items-center justify-end">
          <Button onClick={loadSettings} variant="outline" disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizează
          </Button>
        </div>

      {/* Shipping Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setări Livrare</CardTitle>
          <CardDescription>
            Configurează costurile de livrare și opțiunile de transport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-fee">Tarif de Transport (RON)</Label>
              <div className="flex gap-3">
                <Input
                  id="shipping-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="19.99"
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveShippingFee}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Acesta este tariful standard de livrare care va fi aplicat la toate comenzile.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="free-threshold">Prag livrare gratuită (RON)</Label>
              <Input
                id="free-threshold"
                type="number"
                step="0.01"
                min="0"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-600">0 = dezactivat. Când subtotalul depășește pragul, livrarea devine 0 RON.</p>
            </div>

            {/* Display current value */}
            {settings.find(s => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents') && (
              <div className="pt-4 border-t">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valoare curentă:</span>
                    <span className="font-medium">
                      {(parseInt(settings.find(s => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents')?.value || '0') / 100).toFixed(2)} RON
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ultima modificare:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(settings.find(s => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents')?.updatedAt || '').toLocaleString('ro-RO')}
                    </span>
                  </div>
                  {settings.find(s => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents')?.updatedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modificat de:</span>
                      <span className="text-xs text-gray-500">
                        {settings.find(s => s.key === 'shipping.base_fee_cents' || s.key === 'shipping_fee_cents')?.updatedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notificări Admin</CardTitle>
          <CardDescription>
            Destinatari pentru alerte (Sentry, webhook failures, payout/refund failures). Fără PII.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2 max-w-2xl">
            <Label htmlFor="admin-emails">Admin emails (JSON array)</Label>
            <textarea
              id="admin-emails"
              className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={adminEmailsJson}
              onChange={(e) => setAdminEmailsJson(e.target.value)}
              placeholder='["ops@floristmarket.ro","dev@floristmarket.ro"]'
            />
            <div className="flex gap-3">
              <Button onClick={handleSaveAdminEmails} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Se salvează...' : 'Salvează destinatari'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>On/off, rollout %, target segments (minimal). Include kill switch global.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex items-center gap-3">
            <input
              id="kill-switch"
              type="checkbox"
              checked={killSwitch}
              onChange={(e) => setKillSwitch(e.target.checked)}
            />
            <Label htmlFor="kill-switch">Global kill switch (dezactivează toate flag-urile)</Label>
            <Button variant="outline" size="sm" onClick={handleSaveKillSwitch} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </div>

          <div className="flex gap-3 max-w-xl">
            <Input
              value={newFlagKey}
              onChange={(e) => setNewFlagKey(e.target.value)}
              placeholder="ex: checkout.new_summary"
            />
            <Button onClick={handleAddFlag} disabled={isSaving}>Adaugă</Button>
          </div>

          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nu există flag-uri încă.</p>
            ) : (
              flags.map((f) => (
                <div key={f.key} className="flex items-center gap-4 border rounded-md p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{f.key}</div>
                    <div className="text-xs text-muted-foreground">Rollout: {f.rolloutPct}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">On</Label>
                    <input
                      type="checkbox"
                      checked={!!f.enabled}
                      onChange={(e) => {
                        setFlags((prev) => prev.map((x) => (x.key === f.key ? { ...x, enabled: e.target.checked } : x)));
                      }}
                    />
                  </div>
                  <div className="w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={String(f.rolloutPct ?? 0)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFlags((prev) => prev.map((x) => (x.key === f.key ? { ...x, rolloutPct: v } : x)));
                      }}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUpsertFlag(f)} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvează
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Future Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Setări Adiționale</CardTitle>
          <CardDescription>
            Mai multe opțiuni de configurare vor fi disponibile în curând
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
            <p>• Configurare metode de plată</p>
            <p>• Setări notificări email</p>
            <p>• Configurare curierat multiplu</p>
            <p>• Setări retururi și rambursări</p>
          </div>
        </CardContent>
      </Card>
      </AdminPageWrapper>
    </div>
  );
}

