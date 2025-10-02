/**
 * Pagina principală încasări pentru seller
 * Lista payout-urilor cu filtre și export CSV
 */

'use client';

import { useState, useEffect } from 'react';
import { Payout, PayoutFilters } from '@/lib/types.finante';
import { PayoutsTable } from '@/components/finante/PayoutsTable';
import { listSellerPayouts } from '@/lib/api/payouts';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PayoutFilters>({});

  const loadPayouts = async (newFilters: PayoutFilters = filters) => {
    try {
      setIsLoading(true);
      const response = await listSellerPayouts(newFilters);
      
      if (response.ok && response.data) {
        setPayouts(response.data.items);
      } else {
        toast.error(response.error || 'Eroare la încărcarea payout-urilor');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error loading payouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleFiltersChange = (newFilters: PayoutFilters) => {
    setFilters(newFilters);
    loadPayouts(newFilters);
  };

  const handleRefresh = () => {
    loadPayouts();
  };

  const handleExportCSV = () => {
    toast.success('Export CSV inițiat');
  };

  // Calculează statistici
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = payouts.reduce((sum, p) => sum + p.commission, 0);
  const netAmount = totalAmount - totalCommission;
  const paidCount = payouts.filter(p => p.status === 'PAID').length;
  const pendingCount = payouts.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Încasări</h1>
          <p className="text-gray-600">
            Gestionează payout-urile și urmărește încasările
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizează
        </Button>
      </div>

      {/* Statistici */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Încasări</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalAmount.toFixed(2)} RON
            </div>
            <p className="text-xs text-gray-600">
              {payouts.length} payout-uri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sumă Netă</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {netAmount.toFixed(2)} RON
            </div>
            <p className="text-xs text-gray-600">
              După comisioane
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plătite</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidCount}
            </div>
            <p className="text-xs text-gray-600">
              Payout-uri finalizate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">În Așteptare</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-xs text-gray-600">
              Payout-uri în procesare
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel payout-uri */}
      <PayoutsTable
        payouts={payouts}
        isLoading={isLoading}
        onFiltersChange={handleFiltersChange}
        onExportCSV={handleExportCSV}
      />

      {/* Informații utile */}
      <Card>
        <CardHeader>
          <CardTitle>Informații despre Payout-uri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Când se creează payout-urile?</h4>
              <p className="text-gray-600">
                Payout-urile se creează automat când o comandă este marcată ca livrată.
                Procesarea se face în batch zilnic.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cât durează procesarea?</h4>
              <p className="text-gray-600">
                Payout-urile sunt procesate în 1-3 zile lucrătoare, în funcție de provider-ul de plată.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comisioanele platformei</h4>
              <p className="text-gray-600">
                Platforma percepe un comision de 10% din valoarea comenzii pentru serviciile oferite.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ce să fac dacă un payout eșuează?</h4>
              <p className="text-gray-600">
                Contactează echipa de suport pentru a rezolva problema. Payout-urile eșuate sunt reprocesate automat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
