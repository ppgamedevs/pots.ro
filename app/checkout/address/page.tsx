// Checkout address page for Week 4 MVP frontend
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckoutAddress } from '@/types/checkout';
import { getAddress, setAddress } from '@/lib/checkout-storage';
import { useAutoSave } from '@/lib/use-auto-save';
import { Stepper } from '@/components/checkout/Stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const addressSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere').max(80, 'Numele nu poate avea mai mult de 80 de caractere'),
  phone: z.string().min(7, 'Numărul de telefon trebuie să aibă cel puțin 7 cifre').max(20, 'Numărul de telefon nu poate avea mai mult de 20 de cifre'),
  street: z.string().min(3, 'Adresa trebuie să aibă cel puțin 3 caractere').max(120, 'Adresa nu poate avea mai mult de 120 de caractere'),
  city: z.string().min(2, 'Orașul trebuie să aibă cel puțin 2 caractere').max(60, 'Orașul nu poate avea mai mult de 60 de caractere'),
  county: z.string().min(2, 'Județul trebuie să aibă cel puțin 2 caractere').max(60, 'Județul nu poate avea mai mult de 60 de caractere'),
  zip: z.string().min(4, 'Codul poștal trebuie să aibă cel puțin 4 caractere').max(12, 'Codul poștal nu poate avea mai mult de 12 caractere'),
  note: z.string().max(280, 'Nota nu poate avea mai mult de 280 de caractere').optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function CheckoutAddressPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      phone: '',
      street: '',
      city: '',
      county: '',
      zip: '',
      note: '',
    },
  });

  const watchedValues = watch();

  // Auto-save form data
  useAutoSave(watchedValues, (values) => {
    setAddress(values as CheckoutAddress);
  });

  // Restore saved data on mount
  useEffect(() => {
    const savedAddress = getAddress();
    if (savedAddress) {
      Object.entries(savedAddress).forEach(([key, value]) => {
        setValue(key as keyof AddressFormData, value);
      });
    }
  }, [setValue]);

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      setAddress(data as CheckoutAddress);
      router.push('/checkout/shipping');
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Stepper currentStep={1} steps={['Adresă', 'Transport', 'Plată']} />
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Adresa de livrare
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nume complet *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="mt-1"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Număr de telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="mt-1"
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="street">Adresa completă *</Label>
              <Input
                id="street"
                {...register('street')}
                className="mt-1"
                aria-describedby={errors.street ? 'street-error' : undefined}
              />
              {errors.street && (
                <p id="street-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.street.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="city">Oraș *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  className="mt-1"
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city && (
                  <p id="city-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="county">Județ *</Label>
                <Input
                  id="county"
                  {...register('county')}
                  className="mt-1"
                  aria-describedby={errors.county ? 'county-error' : undefined}
                />
                {errors.county && (
                  <p id="county-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.county.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="zip">Cod poștal *</Label>
                <Input
                  id="zip"
                  {...register('zip')}
                  className="mt-1"
                  aria-describedby={errors.zip ? 'zip-error' : undefined}
                />
                {errors.zip && (
                  <p id="zip-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.zip.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="note">Notă pentru curier (opțional)</Label>
              <Textarea
                id="note"
                {...register('note')}
                className="mt-1"
                rows={3}
                aria-describedby={errors.note ? 'note-error' : undefined}
              />
              {errors.note && (
                <p id="note-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.note.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? 'Se salvează...' : 'Continuă'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
