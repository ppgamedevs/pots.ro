/**
 * Tabel payout-uri pentru seller dashboard
 * Afișează lista payout-urilor cu filtre și export CSV
 */

'use client';

import { useState } from 'react';
import { Payout, PayoutFilters, getPayoutStatusLabel, getPayoutStatusColor } from '@/lib/types.finante';
import { exportPayoutsCSV } from '@/lib/csv/export';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter, Calendar, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/money';

interface PayoutsTableProps {
  payouts: Payout[];
  isLoading?: boolean;
  onFiltersChange?: (filters: PayoutFilters) => void;
  onExportCSV?: () => void;
}

export function PayoutsTable({ 
  payouts, 
  isLoading = false, 
  onFiltersChange,
  onExportCSV 
}: PayoutsTableProps) {
  const ALL_STATUSES = '__ALL__';
  const [filters, setFilters] = useState<PayoutFilters>({
    status: undefined,
    from: undefined,
    to: undefined,
  });

  const handleFilterChange = (key: keyof PayoutFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleExportCSV = () => {
    exportPayoutsCSV(payouts);
    onExportCSV?.();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Încasări</CardTitle>
          <CardDescription>Se încarcă payout-urile...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Încasări</CardTitle>
            <CardDescription>
              {payouts.length} payout-uri găsite
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtre */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select
              value={filters.status ?? ALL_STATUSES}
              onValueChange={(value) => handleFilterChange('status', value === ALL_STATUSES ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>Toate</SelectItem>
                <SelectItem value="PENDING">În așteptare</SelectItem>
                <SelectItem value="PROCESSING">În procesare</SelectItem>
                <SelectItem value="PAID">Plătit</SelectItem>
                <SelectItem value="FAILED">Eșuat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              placeholder="De la"
              value={filters.from || ''}
              onChange={(e) => handleFilterChange('from', e.target.value || undefined)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="Până la"
              value={filters.to || ''}
              onChange={(e) => handleFilterChange('to', e.target.value || undefined)}
              className="w-40"
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Data</TableHead>
                <TableHead scope="col">Comandă</TableHead>
                <TableHead scope="col">Sumă</TableHead>
                <TableHead scope="col">Comision</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Detalii</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nu există payout-uri pentru filtrele selectate
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(payout.createdAt)}</div>
                        {payout.paidAt && (
                          <div className="text-xs text-gray-500">
                            Plătit: {formatDateTime(payout.paidAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payout.orderId.slice(-8)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(payout.amount, payout.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(payout.commission, payout.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getPayoutStatusColor(payout.status)}
                      >
                        {getPayoutStatusLabel(payout.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {payout.providerRef && (
                          <div className="text-xs text-gray-500">
                            Ref: {payout.providerRef.slice(-8)}
                          </div>
                        )}
                        {payout.failureReason && (
                          <div className="text-xs text-red-600">
                            {payout.failureReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Sumar */}
        {payouts.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Sumă</div>
                <div className="font-medium">
                  {formatCurrency(
                    payouts.reduce((sum, p) => sum + p.amount, 0),
                    'RON'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Total Comision</div>
                <div className="font-medium">
                  {formatCurrency(
                    payouts.reduce((sum, p) => sum + p.commission, 0),
                    'RON'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Plătite</div>
                <div className="font-medium text-green-600">
                  {payouts.filter(p => p.status === 'PAID').length}
                </div>
              </div>
              <div>
                <div className="text-gray-600">În așteptare</div>
                <div className="font-medium text-yellow-600">
                  {payouts.filter(p => p.status === 'PENDING').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
