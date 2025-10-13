"use client";

import { useState } from 'react';
import { NetopiaPayment } from '@/components/payments/NetopiaPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export default function NetopiaTestPage() {
  const [orderId, setOrderId] = useState(`TEST-${Date.now()}`);
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Test payment - FloristMarket');
  const [showPayment, setShowPayment] = useState(false);

  const handleStartPayment = () => {
    setShowPayment(true);
  };

  const handleSuccess = () => {
    alert('Plata a fost procesată cu succes!');
    setShowPayment(false);
  };

  const handleError = (error: string) => {
    alert(`Eroare la plată: ${error}`);
  };

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Test Integrare Netopia
          </h1>
          <p className="text-muted">
            Testează integrarea cu gateway-ul de plată Netopia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          {showPayment && (
            <div className="flex justify-center">
              <NetopiaPayment
                orderId={orderId}
                amount={amount}
                currency="RON"
                description={description}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          )}
        </div>

        {/* Test Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informații Test Netopia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Credențiale Test:</h4>
                <ul className="space-y-1 text-muted">
                  <li><strong>Merchant ID:</strong> 33MN-RVFE-X0J6-TUTC-4ZJB</li>
                  <li><strong>Environment:</strong> Test</li>
                  <li><strong>Currency:</strong> RON</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Carduri Test:</h4>
                <ul className="space-y-1 text-muted">
                  <li><strong>Visa:</strong> 4111111111111111</li>
                  <li><strong>Mastercard:</strong> 5555555555554444</li>
                  <li><strong>CVV:</strong> 123</li>
                  <li><strong>Expiry:</strong> 12/25</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Notă Importantă:</h4>
              <p className="text-sm text-blue-700">
                Aceasta este o integrare de test. Plățile nu vor fi procesate efectiv.
                Folosește cardurile de test pentru a simula o plată reușită.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
