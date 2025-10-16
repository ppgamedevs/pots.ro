// Checkout fail page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderPublic } from '@/lib/api-client';
import { OrderPublic } from '@/types/checkout';
import { Button } from '@/components/ui/button';

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare la încărcarea comenzii');
        console.error('Error loading order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Plata a eșuat
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Ne pare rău, dar plata pentru comanda {order ? `#${order.id.slice(-8)}` : ''} nu a putut fi procesată.
            </p>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Vă rugăm să încercați din nou sau să contactați suportul pentru asistență.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/checkout/payment'}
                className="w-full"
              >
                Reîncearcă plata
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/checkout/shipping'}
                className="w-full"
              >
                Modifică transportul
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Înapoi la pagina principală
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          {order && order.items.length > 0 && (
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
                      {new Intl.NumberFormat('ro-RO', {
                        style: 'currency',
                        currency: 'RON',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(item.subtotal_cents / 100)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'RON',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(order.totals.total_cents / 100)}
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
