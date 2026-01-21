import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { H1 } from '@/components/ui/typography';

export default function AdminAnalyticsPage() {
  const breadcrumbItems = [
    { name: 'Admin', href: '/admin' },
    { name: 'Statistici', href: '/admin/analytics' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />
        
        {/* Header */}
        <div className="mb-8">
          <H1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Statistici marketplace
          </H1>
          <p className="text-slate-600 dark:text-slate-400">
            Monitorizați performanța generală a platformei
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-10 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Coming soon</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytics</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Secțiunea de analytics este în lucru. Între timp, poți folosi zona de Finanțe pentru comisioane și payout-uri.
          </p>
        </div>
      </div>
    </div>
  );
}
