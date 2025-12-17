'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shippingFee, setShippingFee] = useState('25.00');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data.settings);

      // Find shipping fee setting
      const shippingFeeSetting = data.settings.find((s: Setting) => s.key === 'shipping_fee_cents');
      if (shippingFeeSetting) {
        setShippingFee((parseInt(shippingFeeSetting.value) / 100).toFixed(2));
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

      if (isNaN(feeCents) || feeCents < 0) {
        toast.error('Valoare invalidă. Introdu un număr pozitiv.');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'shipping_fee_cents',
          value: feeCents.toString(),
          description: 'Shipping fee in cents (RON)',
        }),
      });

      if (!response.ok) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Setări Magazin
          </h1>
          <p className="text-gray-600 mt-1">
            Configurează setările generale ale magazinului
          </p>
        </div>
        <Button onClick={loadSettings} variant="outline" disabled={isLoading}>
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
        <CardContent className="space-y-6">
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
                  placeholder="25.00"
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

            {/* Display current value */}
            {settings.find(s => s.key === 'shipping_fee_cents') && (
              <div className="pt-4 border-t">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valoare curentă:</span>
                    <span className="font-medium">
                      {(parseInt(settings.find(s => s.key === 'shipping_fee_cents')?.value || '0') / 100).toFixed(2)} RON
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ultima modificare:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(settings.find(s => s.key === 'shipping_fee_cents')?.updatedAt || '').toLocaleString('ro-RO')}
                    </span>
                  </div>
                  {settings.find(s => s.key === 'shipping_fee_cents')?.updatedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modificat de:</span>
                      <span className="text-xs text-gray-500">
                        {settings.find(s => s.key === 'shipping_fee_cents')?.updatedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Configurare metode de plată</p>
            <p>• Setări notificări email</p>
            <p>• Configurare curierat multiplu</p>
            <p>• Setări retururi și rambursări</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

