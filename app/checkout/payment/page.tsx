// Checkout payment page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutAddress, ShippingRate, CartItem } from '@/types/checkout';
import { getAddress, getShipping, getOrderId, setOrderId } from '@/lib/checkout-storage';
import { createOrder } from '@/lib/api-client';
import { Stepper } from '@/components/checkout/Stepper';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/lib/money';

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const [address, setAddress] = useState<CheckoutAddress | null>(null);
  const [shipping, setShipping] = useState<ShippingRate | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCheckoutData = async () => {
      const savedAddress = getAddress();
      const savedShipping = getShipping();
      const savedOrderId = getOrderId();

      if (!savedAddress || !savedShipping) {
        router.push('/checkout/address');
        return;
      }

      setAddress(savedAddress);
      setShipping(savedShipping);

      // Load cart items (simplified for MVP - in production, get from cart API)
      try {
        const cartResponse = await fetch('/api/cart');
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          setCartItems(cartData.items || []);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setCartItems([]);
      }
    };

    loadCheckoutData();
  }, [router]);

  const calculateTotals = () => {
    const subtotal_cents = cartItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
    const shipping_fee_cents = shipping?.fee_cents || 0;
    const total_cents = subtotal_cents + shipping_fee_cents;

    return {
      subtotal_cents,
      shipping_fee_cents,
      total_cents,
    };
  };

  const handlePayment = async () => {
    if (!address || !shipping) {
      setError('Datele de comandă nu sunt complete');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      // Check if order already exists
      let orderId = getOrderId();
      
      if (!orderId) {
        // Create new order
        const orderData = await createOrder({
          address,
          shipping,
        });
        
        orderId = orderData.order_id;
        setOrderId(orderId);
      }

      // Navigate to payment processing page
      router.push(`/checkout/pay?order_id=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la crearea comenzii');
      console.error('Error creating order:', err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleBack = () => {
    router.push('/checkout/shipping');
  };

  if (!address || !shipping) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Stepper currentStep={3} steps={['Adresă', 'Transport', 'Plată']} />
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Se încarcă datele comenzii...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Stepper currentStep={3} steps={['Adresă', 'Transport', 'Plată']} />
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Coșul este gol
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Nu aveți produse în coș pentru a finaliza comanda.
              </p>
              <Button onClick={() => router.push('/c/all')}>
                Vezi produse
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Stepper currentStep={3} steps={['Adresă', 'Transport', 'Plată']} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cartItems}
              subtotal_cents={totals.subtotal_cents}
              shipping_fee_cents={totals.shipping_fee_cents}
              total_cents={totals.total_cents}
              currency="RON"
            />
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Finalizare comandă
              </h1>

              {/* Address Summary */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Adresa de livrare
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {address.name}<br />
                  {address.street}<br />
                  {address.city}, {address.county} {address.zip}
                </p>
              </div>

              {/* Shipping Summary */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Transport
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {shipping.carrier} {shipping.service} - {formatCents(shipping.fee_cents, 'RON')}
                </p>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Metoda de plată
                </h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        Netopia
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Plăți online sigure cu card bancar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Înapoi
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isCreatingOrder}
                  className="px-8"
                >
                  {isCreatingOrder ? 'Se procesează...' : 'Plătește cu Netopia'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
