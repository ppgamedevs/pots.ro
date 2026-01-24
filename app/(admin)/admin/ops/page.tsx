import Link from 'next/link';
import { FileText, DatabaseBackup, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

const cards = [
  {
    title: 'Logs',
    description: 'Sentry errors + audit correlation (coming next)',
    href: '/admin/ops/logs',
    icon: FileText,
    color: 'bg-slate-900',
  },
  {
    title: 'Backups',
    description: 'Restore points (Vercel Blob) + request backup',
    href: '/admin/ops/backups',
    icon: DatabaseBackup,
    color: 'bg-emerald-700',
  },
  {
    title: 'Migrations',
    description: 'Migration status + drift detection (coming next)',
    href: '/admin/ops/migrations',
    icon: Wrench,
    color: 'bg-neutral-800',
  },
];

export default function AdminOpsHubPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ops</h1>
        <p className="text-gray-600 mt-2">Logs, backups, migrations (admin-only)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`${item.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
