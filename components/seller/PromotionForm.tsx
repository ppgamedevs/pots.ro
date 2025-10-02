'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PromotionFormProps {
  onSuccess: () => void;
}

interface PromotionData {
  title: string;
  type: 'banner' | 'discount';
  percent?: number;
  value?: number;
  startAt: string;
  endAt: string;
  targetCategorySlug?: string;
  targetProductId?: string;
}

export function PromotionForm({ onSuccess }: PromotionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PromotionData>({
    title: '',
    type: 'discount',
    startAt: '',
    endAt: '',
    targetCategorySlug: '',
    targetProductId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Titlul este obligatoriu');
      }

      if (formData.type === 'discount' && !formData.percent && !formData.value) {
        throw new Error('Specificați procentul sau valoarea reducerii');
      }

      if (!formData.startAt || !formData.endAt) {
        throw new Error('Data de început și sfârșit sunt obligatorii');
      }

      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          percent: formData.percent || undefined,
          value: formData.value || undefined,
          targetCategorySlug: formData.targetCategorySlug || undefined,
          targetProductId: formData.targetProductId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Eroare la crearea promoției');
      }

      toast.success('Promoția a fost creată cu succes!');
      setFormData({
        title: '',
        type: 'discount',
        startAt: '',
        endAt: '',
        targetCategorySlug: '',
        targetProductId: '',
      });
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Eroare necunoscută');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promoție nouă</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titlu promoție</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reducere 20% pe ghivece"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tip promoție</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'banner' | 'discount') => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Reducere</SelectItem>
                <SelectItem value="banner">Banner promoțional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'discount' && (
            <>
              <div>
                <Label htmlFor="percent">Procent reducere (0-100)</Label>
                <Input
                  id="percent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percent || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    percent: e.target.value ? parseInt(e.target.value) : undefined,
                    value: undefined // Clear value when setting percent
                  })}
                  placeholder="20"
                />
              </div>

              <div>
                <Label htmlFor="value">Valoare fixă (RON)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    value: e.target.value ? parseFloat(e.target.value) : undefined,
                    percent: undefined // Clear percent when setting value
                  })}
                  placeholder="10.00"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startAt">Data început</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endAt">Data sfârșit</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetCategorySlug">Categorie țintă (opțional)</Label>
            <Input
              id="targetCategorySlug"
              value={formData.targetCategorySlug}
              onChange={(e) => setFormData({ ...formData, targetCategorySlug: e.target.value })}
              placeholder="ghivece"
            />
          </div>

          <div>
            <Label htmlFor="targetProductId">ID produs țintă (opțional)</Label>
            <Input
              id="targetProductId"
              value={formData.targetProductId}
              onChange={(e) => setFormData({ ...formData, targetProductId: e.target.value })}
              placeholder="uuid-produs"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creează promoția
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
