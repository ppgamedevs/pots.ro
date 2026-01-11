// Checkout success page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderPublic } from '@/lib/api-client';
import { clearAll } from '@/lib/checkout-storage';
import { OrderPublic } from '@/types/checkout';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/lib/money';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setError('ID-ul comenzii nu a fost găsit');
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const orderData = await getOrderPublic(orderId);
        setOrder(orderData);

        // If order is paid, clear checkout storage
        if (orderData.status === 'paid') {
          clearAll();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la încărcarea comenzii');
        console.error('Error loading order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Poll for order status if not paid yet
  useEffect(() => {
    if (!order || order.status === 'paid' || pollingCount >= 15) {
      // After 15 attempts (30 seconds), stop polling and show message
      if (pollingCount >= 15 && order && order.status !== 'paid') {
        // Don't clear interval here, it's already stopped
      }
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const orderData = await getOrderPublic(orderId!);
        setOrder(orderData);
        setPollingCount(prev => prev + 1);

        // If order is paid, clear checkout storage
        if (orderData.status === 'paid') {
          clearAll();
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling order:', err);
        setPollingCount(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [order, orderId, pollingCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Se încarcă detaliile comenzii...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Eroare la încărcarea comenzii
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error}
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Înapoi la pagina principală
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const isPaid = order.status === 'paid';
  const isProcessing = order.status === 'pending' && pollingCount < 15;
  const pollingTimeout = pollingCount >= 15 && order.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {isPaid ? (
            <div className="text-center py-12">
              <div className="text-green-600 dark:text-green-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Mulțumim pentru comandă!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                Comanda #{order.id.slice(-8)} a fost plătită cu succes.
              </p>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Veți primi un email de confirmare în curând cu detaliile comenzii.
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = `/orders/${order.id}`}
                  className="w-full"
                >
                  Vezi comanda
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Continuă cumpărăturile
                </Button>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Plata în procesare...
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Vă rugăm să așteptați în timp ce procesăm plata comenzii.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Dacă pagina rămâne blocată, comanda ta va apărea în{" "}
                <a href="/comenzi" className="text-primary hover:underline">Comenzile mele</a>{" "}
                unde poți reîncerca plata.
              </p>
            </div>
          ) : pollingTimeout ? (
            <div className="text-center py-12">
              <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Statusul plății este în verificare
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Comanda ta a fost creată, dar nu am putut confirma plata încă. Comanda apare în{" "}
                <strong>Comenzile mele</strong> unde poți verifica statusul și reîncerca plata dacă este necesar.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = `/comenzi`}
                  className="w-full"
                >
                  Vezi comenzile mele
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/finalizare/pay?order_id=${orderId}`}
                  className="w-full"
                >
                  Reîncearcă plata
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Statusul plății este necunoscut
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Nu am putut confirma statusul plății. Comanda ta apare în{" "}
                <strong>Comenzile mele</strong> unde poți verifica statusul și reîncerca plata.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = `/comenzi`}
                  className="w-full"
                >
                  Vezi comenzile mele
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/finalizare/pay?order_id=${orderId}`}
                  className="w-full"
                >
                  Reîncearcă plata
                </Button>
              </div>
            </div>
          )}

          {/* Order Summary */}
          {isPaid && order.items.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Detalii comandă
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                          width={48}
                          height={48}
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Cantitate: {item.qty}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCents(item.subtotal_cents, 'RON')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatCents(order.totals.total_cents, 'RON')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
