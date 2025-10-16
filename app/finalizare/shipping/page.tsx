// Checkout shipping page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutAddress, ShippingRate } from '@/types/checkout';
import { getAddress, getShipping, setShipping } from '@/lib/checkout-storage';
import { getShippingRates } from '@/lib/api-client';
import { Stepper } from '@/components/checkout/Stepper';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/lib/money';

export default function CheckoutShippingPage() {
  const router = useRouter();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShippingRates = async () => {
      try {
        const address = getAddress();
        if (!address) {
          router.push('/checkout/address');
          return;
        }

        const rates = await getShippingRates(address);
        setShippingRates(rates);

        // Restore previously selected shipping
        const savedShipping = getShipping();
        if (savedShipping) {
          setSelectedShipping(savedShipping);
        } else if (rates.length > 0) {
          // Default to cheapest option
          const cheapest = rates.reduce((prev, current) => 
            prev.fee_cents < current.fee_cents ? prev : current
          );
          setSelectedShipping(cheapest);
        }
      } catch (err) {
        setError('Eroare la încărcarea opțiunilor de transport');
        console.error('Error loading shipping rates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadShippingRates();
  }, [router]);

  const handleShippingSelect = (shipping: ShippingRate) => {
    setSelectedShipping(shipping);
    setShipping(shipping);
  };

  const handleContinue = () => {
    if (selectedShipping) {
      router.push('/checkout/payment');
    }
  };

  const handleBack = () => {
    router.push('/checkout/address');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Stepper currentStep={2} steps={['Adresă', 'Transport', 'Plată']} />
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                Se încarcă opțiunile de transport...
              </span>
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
          <Stepper currentStep={2} steps={['Adresă', 'Transport', 'Plată']} />
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Eroare la încărcarea transportului
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error}
              </p>
              <Button onClick={() => window.location.reload()}>
                Încearcă din nou
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
        <Stepper currentStep={2} steps={['Adresă', 'Transport', 'Plată']} />
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Alegeți transportul
          </h1>

          <div className="space-y-4">
            {shippingRates.map((rate) => (
              <div
                key={`${rate.carrier}-${rate.service}`}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedShipping?.carrier === rate.carrier && selectedShipping?.service === rate.service
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => handleShippingSelect(rate)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="shipping"
                      value={`${rate.carrier}-${rate.service}`}
                      checked={selectedShipping?.carrier === rate.carrier && selectedShipping?.service === rate.service}
                      onChange={() => handleShippingSelect(rate)}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {rate.carrier} {rate.service}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Livrare standard în 2-3 zile lucrătoare
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCents(rate.fee_cents, 'RON')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Înapoi
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedShipping}
            >
              Continuă la plată
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
