'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/datatable';
import { RefreshCw, Search } from 'lucide-react';

type SellerRow = {
  id: string;
  slug: string;
  brandName?: string;
  brand_name?: string;
  status?: string;
  email?: string | null;
  userEmail?: string | null;
  phone?: string | null;
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

function statusVariant(status?: string) {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'destructive';
  return 'secondary';
}

export default function AdminSellersPage() {
  const [q, setQ] = useState('');

  const url = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    return `/api/admin/sellers?${sp.toString()}`;
  }, [q]);

  const { data, error, isLoading, mutate } = useSWR<{ items: SellerRow[] }>(url, fetcher, {
    revalidateOnFocus: false,
  });

  const items = data?.items ?? [];

  const columns: Column<SellerRow>[] = [
    {
      header: 'Seller',
      key: 'brand_name',
      sortable: true,
      render: (seller) => {
        const name = seller.brandName || seller.brand_name || seller.slug;
        return (
          <div className="space-y-1">
            <Link href={`/admin/sellers/${seller.slug || seller.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:underline">
              {name}
            </Link>
            <div className="text-xs text-slate-500">/{seller.slug}</div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (seller) => {
        const s = seller.status;
        return <Badge variant={statusVariant(s) as any}>{s || '—'}</Badge>;
      },
    },
    {
      header: 'Email',
      key: 'email',
      render: (seller) => <span className="text-sm">{seller.email || seller.userEmail || '—'}</span>,
    },
    {
      header: 'Telefon',
      key: 'phone',
      render: (seller) => <span className="text-sm">{seller.phone || '—'}</span>,
    },
  ];

  return (
    <AdminPageWrapper title="Selleri" description="Listă vânzători + acces rapid la notițe, tichete și conversație.">
      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Căutare</CardTitle>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reîncarcă
          </Button>
        </CardHeader>
        <CardContent className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Caută după brand/slug"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Vânzători</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div>
          ) : isLoading && items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Se încarcă vânzătorii...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl">
              <p className="text-base">Nu s-au găsit vânzători.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
              <DataTable
                columns={columns}
                rows={items}
                rowKey={(row) => row.id}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
