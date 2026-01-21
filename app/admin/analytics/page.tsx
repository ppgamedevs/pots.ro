import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { H1 } from '@/components/ui/typography';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';

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

        {/* Analytics Content */}
        <AdminAnalytics />
      </div>
    </div>
  );
}
