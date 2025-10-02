/**
 * Panou pentru seller să gestioneze retururile
 * Aprobare, propunere soluție, note
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, User, MessageSquare, Package, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { approveReturn } from '@/lib/api/returns';
import { formatCurrency } from '@/lib/money';

interface ReturnRequest {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  reason: string;
  method: 'exchange' | 'refund';
  status: 'return_requested' | 'return_approved' | 'returned';
  requestedAt: string;
  orderTotal: number;
}

interface SellerReturnPanelProps {
  returnRequest: ReturnRequest;
  onReturnApproved?: () => void;
}

export function SellerReturnPanel({
  returnRequest,
  onReturnApproved
}: SellerReturnPanelProps) {
  const [solution, setSolution] = useState<'approve_exchange' | 'approve_refund' | 'reject'>('approve_exchange');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status display
  const getStatusDisplay = () => {
    switch (returnRequest.status) {
      case 'return_requested':
        return {
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          text: 'În așteptare',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'return_approved':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          text: 'Aprobat',
          color: 'bg-green-100 text-green-800'
        };
      case 'returned':
        return {
          icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
          text: 'Finalizat',
          color: 'bg-blue-100 text-blue-800'
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

  // Submit solution
  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Te rugăm să introduci notele pentru soluția propusă');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await approveReturn(returnRequest.orderId, {
        solution: solution === 'reject' ? 'rejected' : 'approved',
        notes: notes.trim(),
        method: solution === 'approve_exchange' ? 'exchange' : 'refund'
      });

      if (response.ok && response.data) {
        toast.success('Soluția a fost trimisă cu succes');
        setNotes('');
        onReturnApproved?.();
      } else {
        toast.error(response.error || 'Eroare la trimiterea soluției');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error approving return:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Gestionează Retur
        </CardTitle>
        <CardDescription>
          Analizează solicitarea și propune o soluție
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status curent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusDisplay.icon}
            <span className="font-medium">Status:</span>
            <Badge className={statusDisplay.color}>
              {statusDisplay.text}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            Solicitat: {new Date(returnRequest.requestedAt).toLocaleDateString('ro-RO')}
          </div>
        </div>

        {/* Informații buyer */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informații buyer
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nume:</span>
              <div className="font-medium">{returnRequest.buyerName}</div>
            </div>
            <div>
              <span className="text-gray-600">Comandă:</span>
              <div className="font-medium">#{returnRequest.orderId}</div>
            </div>
          </div>
        </div>

        {/* Detalii solicitare */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Detalii solicitare
          </h4>
          
          <div className="space-y-2">
            <Label>Motivul returului:</Label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {returnRequest.reason}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Metoda solicitată:</Label>
              <div className="flex items-center gap-2 mt-1">
                {returnRequest.method === 'refund' ? (
                  <CreditCard className="h-4 w-4 text-red-600" />
                ) : (
                  <Package className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm">
                  {returnRequest.method === 'refund' ? 'Returnare bani' : 'Schimb'}
                </span>
              </div>
            </div>
            <div>
              <Label>Valoare comandă:</Label>
              <div className="text-sm font-medium">
                {formatCurrency(returnRequest.orderTotal, 'RON')}
              </div>
            </div>
          </div>
        </div>

        {/* Dacă returul a fost deja procesat */}
        {returnRequest.status !== 'return_requested' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {returnRequest.status === 'return_approved' 
                ? 'Returul a fost aprobat și este în curs de procesare.'
                : 'Returul a fost finalizat cu succes.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Formular soluție (doar dacă în așteptare) */}
        {returnRequest.status === 'return_requested' && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">Propune soluție</h4>
              
              <div className="space-y-3">
                <Label>Soluția propusă</Label>
                <Select value={solution} onValueChange={(value) => setSolution(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează soluția" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve_exchange">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Aprobă schimbul
                      </div>
                    </SelectItem>
                    <SelectItem value="approve_refund">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Aprobă returnarea banilor
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Respinge returul
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note pentru buyer *</Label>
                <Textarea
                  id="notes"
                  placeholder="Explică soluția propusă și pașii următori..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Preview soluție */}
              {solution && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Previzualizare soluție:</h5>
                  <div className="text-sm text-blue-800">
                    {solution === 'approve_exchange' && (
                      <p>✅ Vei aproba schimbul produselor conform cererii buyer-ului.</p>
                    )}
                    {solution === 'approve_refund' && (
                      <p>💰 Vei aproba returnarea banilor în valoare de {formatCurrency(returnRequest.orderTotal, 'RON')}.</p>
                    )}
                    {solution === 'reject' && (
                      <p>❌ Vei respinge solicitarea de retur cu motivul specificat în note.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  Anulează
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!notes.trim() || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Se trimite...' : 'Trimite Soluția'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
