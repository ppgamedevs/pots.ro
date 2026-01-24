'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PromotionsBannersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/promotions" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Promotions
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Banner Manager</h1>
      <p className="text-gray-600 mt-1">Upload, schedule, placement, targeting, A/B, CTR. Asset quarantine + rollback.</p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">
          UI implementation in progress. Next: wire to <code>/api/admin/promotions/banners</code> + asset scan/quarantine gating.
        </p>
      </div>
    </div>
  );
}
