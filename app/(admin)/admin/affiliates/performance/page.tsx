'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AffiliatesPerformancePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/affiliates" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Affiliates
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Affiliate Performance</h1>
      <p className="text-gray-600 mt-1">Attribution, commission events, payouts, and fraud signals.</p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">
          UI implementation in progress. Next: wire to <code>/api/admin/affiliates/performance</code>.
        </p>
      </div>
    </div>
  );
}
