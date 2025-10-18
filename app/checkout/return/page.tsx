"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function NetopiaReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unknown'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const order = searchParams.get('order');
    const status = searchParams.get('status');
    
    setOrderId(order);
    
    if (status === 'success' || status === 'paid') {
      setStatus('success');
    } else if (status === 'error' || status === 'failed') {
      setStatus('error');
    } else {
      setStatus('unknown');
    }
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      window.location.href = `/checkout/success?order_id=${orderId}`;
    } else {
      window.location.href = `/checkout/fail?order_id=${orderId}`;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Clock className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            {status === 'unknown' && <Clock className="h-6 w-6 text-yellow-600" />}
            
            {status === 'loading' && 'Se procesează plata...'}
            {status === 'success' && 'Plata a fost procesată cu succes!'}
            {status === 'error' && 'Plata a eșuat'}
            {status === 'unknown' && 'Status necunoscut'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="space-y-2">
              <p className="text-muted">
                Vă rugăm să așteptați în timp ce procesăm plata comenzii.
              </p>
              <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-muted">
                Comanda #{orderId?.slice(-8)} a fost plătită cu succes.
              </p>
              <p className="text-sm text-muted">
                Veți primi un email de confirmare în curând.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-muted">
                Ne pare rău, dar plata pentru comanda #{orderId?.slice(-8)} nu a putut fi procesată.
              </p>
              <p className="text-sm text-muted">
                Vă rugăm să încercați din nou sau să contactați suportul.
              </p>
            </div>
          )}
          
          {status === 'unknown' && (
            <div className="space-y-2">
              <p className="text-muted">
                Nu am putut determina statusul plății pentru comanda #{orderId?.slice(-8)}.
              </p>
              <p className="text-sm text-muted">
                Vă rugăm să contactați suportul pentru asistență.
              </p>
            </div>
          )}
          
          <div className="pt-4">
            <Button onClick={handleContinue} className="w-full">
              {status === 'success' ? 'Vezi comanda' : 'Continuă'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
