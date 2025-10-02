/**
 * Detalii payout pentru seller dashboard
 * Afișează informațiile complete despre un payout
 */

'use client';

import { Payout, getPayoutStatusLabel, getPayoutStatusColor } from '@/lib/types.finante';
import { formatCurrency } from '@/lib/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PayoutDetailProps {
  payout: Payout;
  order?: {
    id: string;
    buyerEmail?: string;
    items: Array<{
      productName: string;
      qty: number;
      unitPrice: number;
      subtotal: number;
    }>;
    subtotal: number;
    shippingFee: number;
    total: number;
  };
}

export function PayoutDetail({ payout, order }: PayoutDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO');
  };

  const getStatusIcon = (status: Payout['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header cu status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Payout #{payout.id.slice(-8)}
                {getStatusIcon(payout.status)}
              </CardTitle>
              <CardDescription>
                Creat la {formatDate(payout.createdAt)}
              </CardDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={getPayoutStatusColor(payout.status)}
            >
              {getPayoutStatusLabel(payout.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Detalii financiare */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Detalii Financiare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Sumă Totală</div>
              <div className="text-lg font-semibold">
                {formatCurrency(payout.amount, payout.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Comision Platformă</div>
              <div className="text-lg font-semibold text-red-600">
                -{formatCurrency(payout.commission, payout.currency)}
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Sumă Netă de Primit</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(payout.amount - payout.commission, payout.currency)}
            </div>
          </div>

          {payout.providerRef && (
            <div>
              <div className="text-sm text-gray-600">Referință Provider</div>
              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {payout.providerRef}
              </div>
            </div>
          )}

          {payout.paidAt && (
            <div>
              <div className="text-sm text-gray-600">Data Plății</div>
              <div className="font-medium">
                {formatDate(payout.paidAt)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eroare payout */}
      {payout.failureReason && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Eroare Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600 bg-red-50 p-3 rounded">
              {payout.failureReason}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalii comandă */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalii Comandă
            </CardTitle>
            <CardDescription>
              Comanda #{order.id.slice(-8)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.buyerEmail && (
              <div>
                <div className="text-sm text-gray-600">Cumpărător</div>
                <div className="font-medium">{order.buyerEmail}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-600 mb-2">Produse</div>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        {item.qty} × {formatCurrency(item.unitPrice, 'RON')}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.subtotal, 'RON')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.subtotal, 'RON')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxă livrare</span>
                <span>{formatCurrency(order.shippingFee, 'RON')}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total comandă</span>
                <span>{formatCurrency(order.total, 'RON')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Istoric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <div className="font-medium">Payout creat</div>
                <div className="text-sm text-gray-600">{formatDate(payout.createdAt)}</div>
              </div>
            </div>

            {payout.status === 'PROCESSING' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div>
                  <div className="font-medium">În procesare</div>
                  <div className="text-sm text-gray-600">Se procesează către provider</div>
                </div>
              </div>
            )}

            {payout.status === 'PAID' && payout.paidAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <div className="font-medium">Plătit cu succes</div>
                  <div className="text-sm text-gray-600">{formatDate(payout.paidAt)}</div>
                </div>
              </div>
            )}

            {payout.status === 'FAILED' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <div>
                  <div className="font-medium">Eșuat</div>
                  <div className="text-sm text-gray-600">{payout.failureReason}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
