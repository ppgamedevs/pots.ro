'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderFilters, OrderStatus } from '@/lib/types';
import { SearchIcon, XIcon } from 'lucide-react';

interface OrderFiltersProps {
  role: 'seller' | 'admin';
  onFiltersChange: (filters: OrderFilters) => void;
}

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'refunded', label: 'Refunded' },
];

const CARRIERS = [
  { value: 'cargus', label: 'Cargus' },
  { value: 'dpd', label: 'DPD' },
  { value: 'mock', label: 'Mock' },
];

export function OrderFiltersComponent({ role, onFiltersChange }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<OrderFilters>({
    status: searchParams.get('status') as OrderStatus || undefined,
    q: searchParams.get('q') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    carrier: searchParams.get('carrier') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilters = (newFilters: Partial<OrderFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl);
  };

  const resetFilters = () => {
    setFilters({
      status: undefined,
      q: '',
      from: '',
      to: '',
      carrier: '',
      page: 1,
    });
    router.replace(window.location.pathname);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== '' && value !== 1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-medium">
              Search (ID, Email)
            </label>
            <Input
              id="search"
              placeholder="Search orders..."
              value={filters.q}
              onChange={(e) => updateFilters({ q: e.target.value, page: 1 })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilters({ status: value as OrderStatus || undefined, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <label htmlFor="from" className="text-sm font-medium">
              From Date
            </label>
            <Input
              id="from"
              type="date"
              value={filters.from}
              onChange={(e) => updateFilters({ from: e.target.value, page: 1 })}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-medium">
              To Date
            </label>
            <Input
              id="to"
              type="date"
              value={filters.to}
              onChange={(e) => updateFilters({ to: e.target.value, page: 1 })}
            />
          </div>

          {/* Carrier (Admin only) */}
          {role === 'admin' && (
            <div className="space-y-2">
              <label htmlFor="carrier" className="text-sm font-medium">
                Carrier
              </label>
              <Select
                value={filters.carrier || ''}
                onValueChange={(value) => updateFilters({ carrier: value || undefined, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All carriers</SelectItem>
                  {CARRIERS.map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
