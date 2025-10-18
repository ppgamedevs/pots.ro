"use client";

import { useState } from 'react';
import { NetopiaPayment } from '@/components/payments/NetopiaPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function NetopiaTestPage() {
  const [orderId, setOrderId] = useState(`TEST-${Date.now()}`);
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Test payment - FloristMarket');
  const [showPayment, setShowPayment] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    id: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: Date;
  }>>([]);

  const handleStartPayment = () => {
    setShowPayment(true);
    addTestResult('pending', 'Inițiere plată...');
  };

  const handleSuccess = () => {
    addTestResult('success', 'Plata a fost procesată cu succes!');
    setShowPayment(false);
  };

  const handleError = (error: string) => {
    addTestResult('error', `Eroare: ${error}`);
    setShowPayment(false);
  };

  const addTestResult = (status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => [{
      id: Date.now().toString(),
      status,
      message,
      timestamp: new Date(),
    }, ...prev.slice(0, 9)]); // Keep only last 10 results
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Test Integrare Netopia
          </h1>
          <p className="text-muted">
            Testează integrarea cu gateway-ul de plată Netopia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Configurare Plată Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orderId">ID Comandă</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="TEST-123456"
                />
              </div>

              <div>
                <Label htmlFor="amount">Sumă (RON)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="description">Descriere</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrierea comenzii"
                />
              </div>

              <Button onClick={handleStartPayment} className="w-full">
                Inițiază Plata Test
              </Button>
            </CardContent>
          </Card>

          {/* Payment Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Componentă Plată
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showPayment ? (
                <NetopiaPayment
                  orderId={orderId}
                  amount={amount}
                  currency="RON"
                  description={description}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <div className="text-center py-8 text-muted">
                  Apasă "Inițiază Plata Test" pentru a începe
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Rezultate Test
                </span>
                {testResults.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    Șterge
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  Nu există rezultate încă
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0 mt-0.5">
                        {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {result.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {result.status === 'pending' && <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{result.message}</p>
                        <p className="text-xs text-muted">
                          {result.timestamp.toLocaleTimeString('ro-RO')}
                        </p>
                      </div>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informații Test Netopia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credențiale Test:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Merchant ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">33MN-RVFE-X0J6-TUTC-4ZJB</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Environment:</span>
                    <Badge variant="secondary">Test</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Currency:</span>
                    <Badge variant="outline">RON</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Carduri Test:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Visa:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">4111111111111111</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Mastercard:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">5555555555554444</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">CVV:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">123</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Expiry:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">12/25</code>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🔒 Securitate</h4>
                <p className="text-sm text-blue-700">
                  Toate plățile sunt semnate cu RSA-SHA256 și verificate cu certificatele publice.
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Testare</h4>
                <p className="text-sm text-green-700">
                  Aceasta este o integrare de test. Plățile nu vor fi procesate efectiv.
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">📧 Notificări</h4>
                <p className="text-sm text-purple-700">
                  După plată, se trimit emailuri de confirmare și se actualizează inventarul.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
