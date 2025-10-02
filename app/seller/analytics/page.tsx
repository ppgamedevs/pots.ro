import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { H1 } from '@/components/ui/typography';
import { SellerAnalytics } from '@/components/seller/SellerAnalytics';

export default function SellerAnalyticsPage() {
  const breadcrumbItems = [
    { name: 'Dashboard', href: '/seller-dashboard' },
    { name: 'Statistici', href: '/seller/analytics' },
  ];

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
              Statistici vânzări
            </H1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitorizați performanța produselor și vânzările dumneavoastră
            </p>
          </div>

          {/* Analytics Content */}
          <SellerAnalytics />
        </div>
      </div>
      <Footer />
    </>
  );
}
