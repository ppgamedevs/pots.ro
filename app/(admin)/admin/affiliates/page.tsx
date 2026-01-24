'use client';

import Link from 'next/link';
import { ArrowLeft, Handshake, Ticket, BarChart3 } from 'lucide-react';

const sections = [
  {
    title: 'Partners',
    description: 'Partners, codes, performance; prevent self-dealing and fraud',
    href: '/admin/affiliates/partners',
    icon: Handshake,
    color: 'bg-emerald-700',
  },
  {
    title: 'Codes',
    description: 'Create/edit/disable codes, commission/payout rules',
    href: '/admin/affiliates/codes',
    icon: Ticket,
    color: 'bg-teal-600',
  },
  {
    title: 'Performance',
    description: 'Attribution + commission events overview, suspicious activity flags',
    href: '/admin/affiliates/performance',
    icon: BarChart3,
    color: 'bg-slate-700',
  },
];

export default function AffiliatesHubPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Affiliates</h1>
        <p className="text-gray-600 mt-1">Partners, codes, payouts, and fraud controls</p>
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
