/**
 * Panou pentru admin să gestioneze retururile global
 * Override/decizie finală, vizualizare completă
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, MessageSquare, Package, CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { approveReturn } from '@/lib/api/returns';
import { formatCurrency } from '@/lib/money';

interface ReturnRequest {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  method: 'exchange' | 'refund';
  status: 'return_requested' | 'return_approved' | 'returned';
  requestedAt: string;
  sellerResponse?: {
    solution: 'approved' | 'rejected';
    notes: string;
    respondedAt: string;
  };
  orderTotal: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface AdminReturnPanelProps {
  returnRequest: ReturnRequest;
  onReturnProcessed?: () => void;
}

export function AdminReturnPanel({
  returnRequest,
  onReturnProcessed
}: AdminReturnPanelProps) {
  const [adminDecision, setAdminDecision] = useState<'approve' | 'reject' | 'override'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
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

  // Submit admin decision
  const handleSubmit = async () => {
    if (!adminNotes.trim()) {
      toast.error('Te rugăm să introduci notele pentru decizia administrativă');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await approveReturn(returnRequest.orderId, {
        solution: adminDecision === 'reject' ? 'rejected' : 'approved',
        notes: adminNotes.trim(),
        method: returnRequest.method,
        adminOverride: adminDecision === 'override'
      });

      if (response.ok && response.data) {
        toast.success('Decizia administrativă a fost aplicată cu succes');
        setAdminNotes('');
        onReturnProcessed?.();
      } else {
        toast.error(response.error || 'Eroare la aplicarea deciziei');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error processing return:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin - Gestionează Retur
        </CardTitle>
        <CardDescription>
          Decizie finală și override pentru retururi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status și informații generale */}
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

        {/* Tabs pentru vizualizare detaliată */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
            <TabsTrigger value="details">Detalii comandă</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Informații buyer și seller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Buyer
                </h4>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-600">Nume:</span> {returnRequest.buyerName}</div>
                  <div><span className="text-gray-600">ID:</span> {returnRequest.buyerId}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Seller
                </h4>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-600">Nume:</span> {returnRequest.sellerName}</div>
                  <div><span className="text-gray-600">ID:</span> {returnRequest.sellerId}</div>
                </div>
              </div>
            </div>

            {/* Motiv și metoda */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Solicitare retur
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
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Produse din comandă */}
            <div>
              <h4 className="font-medium mb-3">Produse din comandă</h4>
              <div className="space-y-2">
                {returnRequest.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Cantitate: {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity, 'RON')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            {/* Timeline evenimente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Retur solicitat</div>
                  <div className="text-xs text-gray-600">
                    {new Date(returnRequest.requestedAt).toLocaleString('ro-RO')}
                  </div>
                </div>
              </div>

              {returnRequest.sellerResponse && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="font-medium text-sm">
                      Răspuns seller: {returnRequest.sellerResponse.solution === 'approved' ? 'Aprobat' : 'Respins'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(returnRequest.sellerResponse.respondedAt).toLocaleString('ro-RO')}
                    </div>
                    <div className="text-xs mt-1">
                      {returnRequest.sellerResponse.notes}
                    </div>
                  </div>
                </div>
              )}

              {returnRequest.status === 'returned' && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Retur finalizat</div>
                    <div className="text-xs text-gray-600">
                      Procesat cu succes
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Răspuns seller (dacă există) */}
        {returnRequest.sellerResponse && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Răspuns seller
            </h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">Decizie:</span> 
                <Badge className={`ml-2 ${returnRequest.sellerResponse.solution === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {returnRequest.sellerResponse.solution === 'approved' ? 'Aprobat' : 'Respins'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Note:</span>
                <div className="mt-1 p-2 bg-white rounded text-sm">
                  {returnRequest.sellerResponse.notes}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formular decizie admin */}
        {returnRequest.status === 'return_requested' && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Decizie administrativă
              </h4>
              
              <div className="space-y-3">
                <Label>Decizia administrativă</Label>
                <Select value={adminDecision} onValueChange={(value) => setAdminDecision(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează decizia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Aprobă returul
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Respinge returul
                      </div>
                    </SelectItem>
                    <SelectItem value="override">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Override decizia seller
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Note administrative *</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Explică decizia administrativă și motivele..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Preview decizie */}
              {adminDecision && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Previzualizare decizie:</h5>
                  <div className="text-sm text-blue-800">
                    {adminDecision === 'approve' && (
                      <p>✅ Vei aproba returul conform cererii buyer-ului.</p>
                    )}
                    {adminDecision === 'reject' && (
                      <p>❌ Vei respinge returul cu motivul specificat în note.</p>
                    )}
                    {adminDecision === 'override' && (
                      <p>⚠️ Vei suprascrie decizia seller-ului cu o decizie administrativă.</p>
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
                  disabled={!adminNotes.trim() || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Se procesează...' : 'Aplică Decizia'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Dacă returul a fost procesat */}
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
      </CardContent>
    </Card>
  );
}
