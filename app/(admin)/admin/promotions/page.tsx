'use client';

import Link from 'next/link';
import { ArrowLeft, BadgePercent, Image } from 'lucide-react';

const sections = [
  {
    title: 'Discounts',
    description: 'Promotions list, schedule, approvals, preview impact (no stacking abuse)',
    href: '/admin/promotions/discounts',
    icon: BadgePercent,
    color: 'bg-fuchsia-600',
  },
  {
    title: 'Banners',
    description: 'Banner campaigns, placement, targeting, A/B, CTR; asset quarantine + rollback',
    href: '/admin/promotions/banners',
    icon: Image,
    color: 'bg-indigo-600',
  },
];

export default function PromotionsHubPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="text-gray-600 mt-1">Discounts and banners management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((item) => {
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
