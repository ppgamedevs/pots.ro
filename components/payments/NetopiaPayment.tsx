"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';

interface NetopiaPaymentProps {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function NetopiaPayment({
  orderId,
  amount,
  currency = 'RON',
  description,
  onSuccess,
  onError,
}: NetopiaPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/netopia/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.formHtml) {
        // Create a temporary div to inject the form HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.formHtml;
        tempDiv.style.display = 'none'; // Hide the form
        document.body.appendChild(tempDiv);
        
        // Submit the form
        const form = tempDiv.querySelector('form') as HTMLFormElement;
        if (form) {
          form.submit();
        } else {
          throw new Error('Payment form not found');
        }
        
        // Clean up after a delay
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }, 5000);
      } else {
        throw new Error('No payment form received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Plată cu Netopia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted">
          <p><strong>Comandă:</strong> {orderId}</p>
          <p><strong>Sumă:</strong> {amount} {currency}</p>
          <p><strong>Descriere:</strong> {description}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se procesează...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Plătește cu Netopia
            </>
          )}
        </Button>

        <div className="text-xs text-muted text-center">
          Vei fi redirecționat către pagina securizată Netopia pentru a finaliza plata.
        </div>
      </CardContent>
    </Card>
  );
}
