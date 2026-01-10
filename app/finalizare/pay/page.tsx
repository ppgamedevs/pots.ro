// Netopia payment processing page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { initNetopia } from '@/lib/api-client';
import { getOrderId } from '@/lib/checkout-storage';
import { Button } from '@/components/ui/button';

export default function CheckoutPayPage() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get order ID from URL params or localStorage
        const orderIdFromUrl = searchParams.get('order_id');
        const orderIdFromStorage = getOrderId();
        const orderId = orderIdFromUrl || orderIdFromStorage;

        if (!orderId) {
          throw new Error('ID-ul comenzii nu a fost găsit');
        }

        // Initialize Netopia payment
        const paymentResponse = await initNetopia(orderId);

        if (paymentResponse.formHtml) {
          // Auto-submit the form
          // Create a temporary container that's hidden
          const tempDiv = document.createElement('div');
          tempDiv.style.display = 'none';
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          
          // Set innerHTML safely
          tempDiv.innerHTML = paymentResponse.formHtml;
          
          // Append to body
          if (document.body) {
            document.body.appendChild(tempDiv);
            
            // Find and submit the form
            const form = tempDiv.querySelector('form') as HTMLFormElement;
            if (form) {
              // Small delay to ensure form is ready
              setTimeout(() => {
                form.submit();
                // Clean up after submission
                setTimeout(() => {
                  if (tempDiv.parentNode) {
                    tempDiv.parentNode.removeChild(tempDiv);
                  }
                }, 100);
              }, 50);
            } else {
              // Clean up if form not found
              if (tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
              }
              throw new Error('Formularul de plată nu a fost găsit');
            }
          } else {
            throw new Error('Document body nu este disponibil');
          }
        } else if (paymentResponse.redirectUrl) {
          // Redirect to payment URL
          window.location.replace(paymentResponse.redirectUrl);
        } else {
          throw new Error('Răspuns invalid de la serviciul de plată');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la inițializarea plății');
        setIsProcessing(false);
        console.error('Payment initialization error:', err);
      }
    };

    processPayment();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Eroare la inițializarea plății
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/checkout/payment'}
                  className="w-full"
                >
                  Încearcă din nou
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/checkout/shipping'}
                  className="w-full"
                >
                  Înapoi la transport
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Se inițiază plata...
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Veți fi redirecționat către pagina de plată Netopia în câteva secunde.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
