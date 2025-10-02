'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { H1 } from '@/components/ui/typography';
import { PromotionForm } from '@/components/seller/PromotionForm';
import { PromotionList } from '@/components/seller/PromotionList';

export default function SellerPromotionsPage() {
  const breadcrumbItems = [
    { name: 'Dashboard', href: '/seller-dashboard' },
    { name: 'Promoții', href: '/seller/promotions' },
  ];

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          {/* Header */}
          <div className="mb-8">
            <H1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Promoții
            </H1>
            <p className="text-slate-600 dark:text-slate-400">
              Creați și gestionați promoțiile pentru produsele dumneavoastră
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <PromotionForm onSuccess={handleSuccess} />
            </div>
            <div>
              <PromotionList />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
