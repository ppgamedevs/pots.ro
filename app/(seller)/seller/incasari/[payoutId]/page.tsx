/**
 * Pagina detalii payout pentru seller
 * Afișează informațiile complete despre un payout specific
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Payout } from '@/lib/types.finante';
import { PayoutDetail } from '@/components/finante/PayoutDetail';
import { getPayout } from '@/lib/api/payouts';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SellerPayoutDetailPage() {
  const params = useParams();
  const payoutId = params.payoutId as string;
  
  const [payout, setPayout] = useState<Payout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayout = async () => {
    try {
      setIsLoading(true);
      const response = await getPayout(payoutId);
      
      if (response.ok && response.data) {
        setPayout(response.data);
      } else {
        toast.error(response.error || 'Eroare la încărcarea payout-ului');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error loading payout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (payoutId) {
      loadPayout();
    }
  }, [payoutId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Se încarcă...</h1>
            <p className="text-gray-600">Payout #{payoutId?.slice(-8)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/seller/incasari">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payout nu a fost găsit</h1>
            <p className="text-gray-600">Payout #{payoutId?.slice(-8)}</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Payout-ul cu ID-ul {payoutId} nu a fost găsit sau nu ai acces la el.
            </p>
            <Link href="/seller/incasari">
              <Button>Înapoi la Încasări</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock order data pentru demonstrație
  const mockOrder = {
    id: payout.orderId,
    buyerEmail: 'buyer@example.com',
    items: [
      {
        productName: 'Produs Exemplu',
        qty: 1,
        unitPrice: payout.amount + payout.commission,
        subtotal: payout.amount + payout.commission,
      }
    ],
    subtotal: payout.amount + payout.commission,
    shippingFee: 0,
    total: payout.amount + payout.commission,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/seller/incasari">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payout #{payout.id.slice(-8)}</h1>
            <p className="text-gray-600">
              Creat la {new Date(payout.createdAt).toLocaleDateString('ro-RO')}
            </p>
          </div>
        </div>
        <Button onClick={loadPayout} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizează
        </Button>
      </div>

      {/* Detalii payout */}
      <PayoutDetail payout={payout} order={mockOrder} />

      {/* Acțiuni */}
      <Card>
        <CardHeader>
          <CardTitle>Acțiuni</CardTitle>
          <CardDescription>
            Opțiuni disponibile pentru acest payout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link href="/seller/incasari">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la Listă
              </Button>
            </Link>
            
            {payout.status === 'FAILED' && (
              <Button variant="outline" className="text-red-600 border-red-200">
                Contactează Suport
              </Button>
            )}
            
            <Button variant="outline">
              Descarcă PDF
            </Button>
          </div>
          
          {payout.status === 'FAILED' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Payout Eșuat</h4>
              <p className="text-sm text-red-700 mb-3">
                Acest payout a eșuat din următorul motiv: {payout.failureReason}
              </p>
              <p className="text-sm text-red-700">
                Te rugăm să contactezi echipa de suport pentru a rezolva problema.
                Payout-urile eșuate sunt reprocesate automat în următoarele 24 de ore.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
