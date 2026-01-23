/**
 * Pagina principală finanțe pentru admin
 * Dashboard cu tabs pentru Payouts, Refunds și Rapoarte
 */

'use client';

import { useState, useEffect } from 'react';
import { Payout, PayoutFilters, Refund, RefundFilters } from '@/lib/types.finante';
import { PayoutsTable } from '@/components/finante/PayoutsTable';
import { RefundsTable } from '@/components/finante/RefundsTable';
import { FinanceMiniReport } from '@/components/finante/FinanceMiniReport';
import { listPayouts, markPayoutPaid, runPayoutBatch } from '@/lib/api/payouts';
import { approveAndRunPayout, getPayoutsExportUrl, requestPayoutApproval } from '@/lib/api/payouts';
import { listRefunds, createRefund, retryRefund, markRefundFailed } from '@/lib/api/refunds';
import { listLedger, type LedgerFilters } from '@/lib/api/ledger';
import type { LedgerEntry } from '@/lib/types.finante';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Play, Download, TrendingUp, CreditCard, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/money';
import { SeoToolsTab } from '@/components/admin/SeoToolsTab';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState('payouts');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(true);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const loadLedger = async (filters: LedgerFilters = {}) => {
    try {
      setIsLoadingLedger(true);
      const response = await listLedger(filters);
      if (response.ok && response.data) {
        setLedgerEntries((response.data as any).data || []);
      } else {
        toast.error(response.error || 'Eroare la încărcarea ledger-ului');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error loading ledger:', error);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  // Load payouts
  const loadPayouts = async (filters: PayoutFilters = {}) => {
    try {
      setIsLoadingPayouts(true);
      const response = await listPayouts(filters);
      
      if (response.ok && response.data) {
        setPayouts(response.data.data);
      } else {
        toast.error(response.error || 'Eroare la încărcarea payout-urilor');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error loading payouts:', error);
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  // Load refunds
  const loadRefunds = async (filters: RefundFilters = {}) => {
    try {
      setIsLoadingRefunds(true);
      const response = await listRefunds(filters);
      
      if (response.ok && response.data) {
        setRefunds(response.data.data);
      } else {
        toast.error(response.error || 'Eroare la încărcarea refund-urilor');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error loading refunds:', error);
    } finally {
      setIsLoadingRefunds(false);
    }
  };

  useEffect(() => {
    loadPayouts();
    loadRefunds();
    loadLedger();
  }, []);

  // Batch payout processing
  const handleRunBatchPayouts = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await runPayoutBatch({ date: today });
      
      if (response.ok && response.data) {
        toast.success(`Procesate ${response.data.processed} payout-uri: ${response.data.successful} reușite, ${response.data.failed} eșuate`);
        loadPayouts(); // Reload to show updated status
      } else {
        toast.error(response.error || 'Eroare la procesarea batch payout-urilor');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error running batch payouts:', error);
    }
  };

  // Create refund
  const handleCreateRefund = async (orderId: string, amount: number, reason: string) => {
    try {
      setIsSubmitting(true);
      const response = await createRefund(orderId, {
        orderId,
        amount,
        reason,
      });
      
      if (response.ok && response.data) {
        toast.success('Refund creat cu succes');
        loadRefunds(); // Reload to show new refund
      } else {
        toast.error(response.error || 'Eroare la crearea refund-ului');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error creating refund:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryRefund = async (refundId: string) => {
    try {
      const response = await retryRefund(refundId);
      if (response.ok) {
        toast.success('Retry refund inițiat');
        loadRefunds();
      } else {
        toast.error(response.error || 'Eroare la retry refund');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error retry refund:', error);
    }
  };

  const handleMarkRefundFailed = async (refundId: string) => {
    const reasonCode = prompt('Reason code (e.g. PROVIDER_ERROR, FRAUD_SUSPECT, MANUAL_REVIEW)');
    if (!reasonCode) return;
    const reason = prompt('Reason (details)');
    if (!reason) return;

    try {
      const response = await markRefundFailed(refundId, { reasonCode, reason });
      if (response.ok) {
        toast.success('Refund marcat eșuat');
        loadRefunds();
      } else {
        toast.error(response.error || 'Eroare la marcarea refund-ului');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error mark refund failed:', error);
    }
  };

  const handleRequestPayoutApproval = async (payoutId: string) => {
    try {
      const response = await requestPayoutApproval(payoutId);
      if (response.ok) {
        toast.success('Aprobare cerută (pasul 1)');
      } else {
        toast.error(response.error || 'Eroare la cerere aprobare');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error request payout approval:', error);
    }
  };

  const handleApproveAndRunPayout = async (payoutId: string) => {
    try {
      const response = await approveAndRunPayout(payoutId);
      if (response.ok) {
        toast.success('Payout aprobat și rulat');
        loadPayouts();
      } else {
        toast.error(response.error || 'Eroare la aprobare + rulare');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error approve/run payout:', error);
    }
  };

  const handleMarkPayoutPaid = async (payoutId: string) => {
    const providerRef = prompt('Provider ref (optional)') || '';
    const reason = prompt('Reason (required)') || '';
    if (!reason.trim()) return;

    try {
      const response = await markPayoutPaid(payoutId, { providerRef: providerRef.trim() || undefined, reason: reason.trim() });
      if (response.ok) {
        toast.success('Payout marcat plătit (excepție)');
        loadPayouts();
      } else {
        toast.error(response.error || 'Eroare la mark-paid');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error mark payout paid:', error);
    }
  };

  const handleExportPayoutsBanking = () => {
    const url = getPayoutsExportUrl({ status: 'pending', approvedOnly: true });
    window.open(url, '_blank');
  };

  // Calculează statistici
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
  const pendingPayouts = payouts.filter(p => p.status === 'PENDING').length;
  const failedRefunds = refunds.filter(r => r.status === 'FAILED').length;

  return (
    <div className="space-y-8">
      <AdminPageWrapper 
        title="Finanțe"
        description="Gestionează payout-urile, refund-urile și rapoartele financiare"
      >
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <Button onClick={() => loadPayouts()} variant="outline" disabled={isLoadingPayouts} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPayouts ? 'animate-spin' : ''}`} />
            Actualizează
          </Button>
        </div>

      {/* Statistici rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout-uri</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPayouts, 'RON')}
            </div>
            <p className="text-xs text-gray-600">
              {payouts.length} payout-uri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalRefunds, 'RON')}
            </div>
            <p className="text-xs text-gray-600">
              {refunds.length} refund-uri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout-uri în Așteptare</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPayouts}
            </div>
            <p className="text-xs text-gray-600">
              Necesită procesare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds Eșuate</CardTitle>
            <RefreshCw className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failedRefunds}
            </div>
            <p className="text-xs text-gray-600">
              Necesită atenție
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini-raport financiar */}
      <FinanceMiniReport />

      {/* Tabs pentru Payouts, Refunds și Rapoarte */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payouts">Payout-uri</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="reports">Rapoarte</TabsTrigger>
          <TabsTrigger value="seo">SEO Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-4">
          {/* Acțiuni batch pentru payout-uri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Acțiuni Batch
              </CardTitle>
              <CardDescription>
                Procesează payout-urile în batch pentru o dată specifică
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Run Batch Payouts
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Procesează Batch Payout-uri</DialogTitle>
                      <DialogDescription>
                        Procesează toate payout-urile PENDING pentru data specificată
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="batch-date">Data (YYYY-MM-DD)</Label>
                        <Input
                          id="batch-date"
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline">Anulează</Button>
                        <Button onClick={handleRunBatchPayouts}>
                          Procesează Batch
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" onClick={handleExportPayoutsBanking}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabel payout-uri */}
          <PayoutsTable
            payouts={payouts}
            isLoading={isLoadingPayouts}
            onFiltersChange={loadPayouts}
            onExportCSV={() => toast.success('Export CSV inițiat')}
            onRequestApproval={handleRequestPayoutApproval}
            onApproveAndRun={handleApproveAndRunPayout}
            onMarkPaid={handleMarkPayoutPaid}
          />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          {/* Tabel refund-uri */}
          <RefundsTable
            refunds={refunds}
            isLoading={isLoadingRefunds}
            onFiltersChange={loadRefunds}
            onExportCSV={() => toast.success('Export CSV inițiat')}
            onCreateRefund={handleCreateRefund}
            onRetryRefund={handleRetryRefund}
            onMarkFailed={handleMarkRefundFailed}
          />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ledger (read-only)</CardTitle>
              <CardDescription>Intrări contabile imutabile (filtrare/export minim)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end gap-2 mb-4">
                <Button onClick={() => loadLedger()} variant="outline" disabled={isLoadingLedger} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLedger ? 'animate-spin' : ''}`} />
                  Actualizează
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Data</th>
                      <th className="text-left px-3 py-2">Tip</th>
                      <th className="text-left px-3 py-2">Entity</th>
                      <th className="text-right px-3 py-2">Sumă</th>
                      <th className="text-left px-3 py-2">Valută</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          Nu există intrări
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((e) => (
                        <tr key={e.id} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(e.createdAt).toLocaleString('ro-RO')}</td>
                          <td className="px-3 py-2">{e.type}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{e.entityType}:{e.entityId.slice(-8)}</span>
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(e.amount, e.currency)}</td>
                          <td className="px-3 py-2">{e.currency}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapoarte Financiare</CardTitle>
              <CardDescription>
                Generează rapoarte detaliate pentru perioade specifice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Raport Zilnic
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <CreditCard className="h-6 w-6" />
                  Raport Lunar
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Raport Selleri
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Date</CardTitle>
              <CardDescription>
                Exportă datele financiare în diferite formate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Ledger CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Payouts CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Refunds CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SeoToolsTab />
        </TabsContent>
      </Tabs>
      </AdminPageWrapper>
    </div>
  );
}