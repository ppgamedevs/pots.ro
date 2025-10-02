'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Promotion {
  id: string;
  title: string;
  type: 'banner' | 'discount';
  percent?: number;
  value?: number;
  startAt: string;
  endAt: string;
  active: boolean;
  targetCategorySlug?: string;
  targetProductId?: string;
  createdAt: string;
}

export function PromotionList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/promotions');
      if (!response.ok) {
        throw new Error('Eroare la încărcarea promoțiilor');
      }
      const data = await response.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      toast.error('Eroare la încărcarea promoțiilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const togglePromotion = async (promotionId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/promotions/${promotionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        throw new Error('Eroare la actualizarea promoției');
      }

      toast.success(`Promoția a fost ${active ? 'activată' : 'dezactivată'}`);
      fetchPromotions();
    } catch (error) {
      toast.error('Eroare la actualizarea promoției');
    }
  };

  const deletePromotion = async (promotionId: string) => {
    if (!confirm('Sigur doriți să ștergeți această promoție?')) {
      return;
    }

    try {
      const response = await fetch(`/api/promotions/${promotionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Eroare la ștergerea promoției');
      }

      toast.success('Promoția a fost ștearsă');
      fetchPromotions();
    } catch (error) {
      toast.error('Eroare la ștergerea promoției');
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startAt);
    const endDate = new Date(promotion.endAt);

    if (!promotion.active) {
      return { status: 'inactive', label: 'Inactivă', variant: 'secondary' as const };
    }

    if (now < startDate) {
      return { status: 'scheduled', label: 'Programată', variant: 'warning' as const };
    }

    if (now > endDate) {
      return { status: 'expired', label: 'Expirată', variant: 'destructive' as const };
    }

    return { status: 'active', label: 'Activă', variant: 'success' as const };
  };

  const formatPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'banner') {
      return 'Banner promoțional';
    }

    if (promotion.percent) {
      return `${promotion.percent}% reducere`;
    }

    if (promotion.value) {
      return `${promotion.value / 100} RON reducere`;
    }

    return 'Reducere';
  };

  if (loading) {
    return <div className="text-center py-4">Se încarcă promoțiile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promoțiile mele</CardTitle>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nu aveți promoții create încă.
          </p>
        ) : (
          <div className="space-y-4">
            {promotions.map((promotion) => {
              const statusInfo = getPromotionStatus(promotion);
              
              return (
                <div
                  key={promotion.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{promotion.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatPromotionValue(promotion)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(promotion.startAt), 'dd MMM yyyy', { locale: ro })} - 
                          {format(new Date(promotion.endAt), 'dd MMM yyyy', { locale: ro })}
                        </span>
                      </div>
                      {promotion.targetCategorySlug && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Categorie: {promotion.targetCategorySlug}
                        </p>
                      )}
                      {promotion.targetProductId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Produs: {promotion.targetProductId}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promotion.active}
                        onCheckedChange={(checked) => togglePromotion(promotion.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePromotion(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
