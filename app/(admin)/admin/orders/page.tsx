'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { OrderFiltersComponent } from '@/components/orders/OrderFilters';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetail, OrderFilters } from '@/lib/types';
import { listOrders } from '@/lib/api/orders';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import { toast } from 'sonner';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  const [filters, setFilters] = useState<OrderFilters>({
    status: searchParams.get('status') as any || undefined,
    q: searchParams.get('q') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    carrier: searchParams.get('carrier') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const { data, error, isLoading, mutate } = useSWR(
    ['orders', 'admin', filters],
    () => listOrders({ role: 'admin', ...filters }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Mock unread count for demonstration
  const unreadCountByOrderId: Record<string, number> = {};
  if (data?.data) {
    data.data.forEach((order, index) => {
      // Simulate some orders having unread messages
      if (index % 4 === 0) {
        unreadCountByOrderId[order.id] = Math.floor(Math.random() * 3) + 1;
      }
    });
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Orders</h1>
          <p className="text-gray-600 mb-4">Failed to load orders. Please try again.</p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <main role="main">
        <AdminPageWrapper 
          title="Comenzi"
          description="Gestionează și monitorizează toate comenzile platformei"
        >
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-6">
              <OrderFiltersComponent
                role="admin"
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
              <OrdersTable
                orders={data?.data || []}
                role="admin"
                unreadCountByOrderId={unreadCountByOrderId}
                onPageChange={handlePageChange}
                currentPage={filters.page || 1}
                totalPages={Math.ceil((data?.total || 0) / 20)}
                isLoading={isLoading}
              />
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="pt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
              <p>Keyboard shortcuts: Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">g</kbd> then <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">a</kbd> to navigate to admin orders</p>
            </div>
          </div>
        </AdminPageWrapper>
      </main>
    </div>
  );
}
