/**
 * Formular pentru solicitarea returului de către buyer
 * Validare 14 zile, opțiuni schimb/return bani
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, Package, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { requestReturn } from '@/lib/api/returns';
import { formatCurrency } from '@/lib/money';

interface BuyerReturnFormProps {
  orderId: string;
  orderTotal: number;
  deliveredAt: string;
  currentStatus: 'delivered' | 'return_requested' | 'return_approved' | 'returned';
  onReturnRequested?: () => void;
}

export function BuyerReturnForm({
  orderId,
  orderTotal,
  deliveredAt,
  currentStatus,
  onReturnRequested
}: BuyerReturnFormProps) {
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState<'exchange' | 'refund'>('refund');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculează dacă returul este în termenul de 14 zile
  const deliveryDate = new Date(deliveredAt);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
  const isWithinPolicy = daysSinceDelivery <= 14;

  // Status display
  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'delivered':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          text: 'Comanda livrată',
          color: 'bg-green-100 text-green-800'
        };
      case 'return_requested':
        return {
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          text: 'Retur solicitat',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'return_approved':
        return {
          icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
          text: 'Retur aprobat',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'returned':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          text: 'Retur finalizat',
          color: 'bg-green-100 text-green-800'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-600" />,
          text: 'Status necunoscut',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Submit return request
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Te rugăm să introduci motivul returului');
      return;
    }

    if (!isWithinPolicy) {
      toast.error('Returul nu mai este permis după 14 zile de la livrare');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestReturn(orderId, {
        reason: reason.trim(),
        method: method === 'exchange' ? 'exchange' : 'refund'
      });

      if (response.ok && response.data) {
        toast.success('Solicitarea de retur a fost trimisă cu succes');
        setReason('');
        onReturnRequested?.();
      } else {
        if (response.error?.includes('409') || response.error?.includes('14 zile')) {
          toast.error('Returul nu mai este permis după 14 zile de la livrare');
        } else {
          toast.error(response.error || 'Eroare la trimiterea solicitării de retur');
        }
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error requesting return:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dacă returul a fost deja solicitat sau finalizat, afișează status
  if (currentStatus !== 'delivered') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status Retur
            {statusDisplay.icon}
          </CardTitle>
          <CardDescription>
            Situația curentă a solicitării de retur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Badge className={statusDisplay.color}>
              {statusDisplay.text}
            </Badge>
            
            {currentStatus === 'return_requested' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Solicitarea ta de retur a fost trimisă și este în curs de procesare. 
                  Vei fi notificat când sellerul va aproba sau va propune o soluție.
                </AlertDescription>
              </Alert>
            )}

            {currentStatus === 'return_approved' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Returul a fost aprobat! Următorii pași vor fi comunicați prin email.
                </AlertDescription>
              </Alert>
            )}

            {currentStatus === 'returned' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Returul a fost finalizat cu succes. Dacă ai ales returnarea banilor, 
                  aceștia vor fi procesați în 2-3 zile lucrătoare.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Solicită Retur
        </CardTitle>
        <CardDescription>
          Completează formularul pentru a solicita returul comenzii
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informații comandă */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Detalii comandă</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total comandă:</span>
              <div className="font-medium">{formatCurrency(orderTotal, 'RON')}</div>
            </div>
            <div>
              <span className="text-gray-600">Data livrare:</span>
              <div className="font-medium">
                {deliveryDate.toLocaleDateString('ro-RO')}
              </div>
            </div>
          </div>
        </div>

        {/* Validare 14 zile */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            Zile de la livrare: {daysSinceDelivery}
          </span>
          {isWithinPolicy ? (
            <Badge className="bg-green-100 text-green-800">
              În termenul de 14 zile
            </Badge>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-red-100 text-red-800">
                    Depășit termenul de 14 zile
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Returul nu mai este permis după 14 zile de la livrare</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Motiv retur */}
        <div className="space-y-2">
          <Label htmlFor="reason">Motivul returului *</Label>
          <Textarea
            id="reason"
            placeholder="Descrie motivul pentru care dorești să returnezi produsele..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={!isWithinPolicy}
          />
        </div>

        {/* Metoda retur */}
        <div className="space-y-3">
          <Label>Metoda returului</Label>
          <RadioGroup value={method} onValueChange={(value) => setMethod(value as 'exchange' | 'refund')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="refund" id="refund" disabled={!isWithinPolicy} />
              <Label htmlFor="refund" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Returnare bani ({formatCurrency(orderTotal, 'RON')})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exchange" id="exchange" disabled={!isWithinPolicy} />
              <Label htmlFor="exchange" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Schimb cu alt produs
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Avertizare dacă depășește termenul */}
        {!isWithinPolicy && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Returul nu mai este permis după 14 zile de la livrare. 
              Dacă ai probleme cu produsele, te rugăm să contactezi sellerul direct.
            </AlertDescription>
          </Alert>
        )}

        {/* Buton submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isWithinPolicy || !reason.trim() || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Se trimite...' : 'Solicită Retur'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
