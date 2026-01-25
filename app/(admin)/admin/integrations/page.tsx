'use client';

import Link from 'next/link';
import { CreditCard, HardDrive, Globe, ArrowLeft, FileText } from 'lucide-react';

const integrations = [
  {
    title: 'Payments / Netopia',
    description: 'Status, callback URLs, sandbox/production toggle, test webhook, rotate keys',
    href: '/admin/integrations/payments/netopia',
    icon: CreditCard,
    color: 'bg-emerald-600',
  },
  {
    title: 'Invoicing / SmartBill',
    description: 'Invoice provider status, credentials health, test connection, retry failed invoices',
    href: '/admin/integrations/invoicing',
    icon: FileText,
    color: 'bg-indigo-600',
  },
  {
    title: 'Storage / Blob',
    description: 'File usage, orphaned files, cleanup, quarantine, signed URLs',
    href: '/admin/integrations/storage',
    icon: HardDrive,
    color: 'bg-blue-600',
  },
  {
    title: 'SEO / Sitemaps',
    description: 'Sitemap status, regenerate, validate URLs, submit ping to search engines',
    href: '/admin/integrations/seo',
    icon: Globe,
    color: 'bg-orange-600',
  },
];

export default function IntegrationsHubPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Manage external service connections and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
