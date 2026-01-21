/**
 * Tabel refund-uri pentru admin dashboard
 * Afișează lista refund-urilor cu acțiuni de administrare
 */

'use client';

import { useState } from 'react';
import { Refund, RefundFilters, getRefundStatusLabel, getRefundStatusColor } from '@/lib/types.finante';
import { exportRefundsCSV } from '@/lib/csv/export';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Filter, Calendar, Search, Plus, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/money';

interface RefundsTableProps {
  refunds: Refund[];
  isLoading?: boolean;
  onFiltersChange?: (filters: RefundFilters) => void;
  onExportCSV?: () => void;
  onCreateRefund?: () => void;
  onRetryRefund?: (refundId: string) => void;
}

export function RefundsTable({ 
  refunds, 
  isLoading = false, 
  onFiltersChange,
  onExportCSV,
  onCreateRefund,
  onRetryRefund
}: RefundsTableProps) {
  const ALL_STATUSES = '__ALL__';
  const [filters, setFilters] = useState<RefundFilters>({
    status: undefined,
    orderId: undefined,
    from: undefined,
    to: undefined,
  });

  const handleFilterChange = (key: keyof RefundFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleExportCSV = () => {
    exportRefundsCSV(refunds);
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
          <CardTitle>Refund-uri</CardTitle>
          <CardDescription>Se încarcă refund-urile...</CardDescription>
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
            <CardTitle>Refund-uri</CardTitle>
            <CardDescription>
              {refunds.length} refund-uri găsite
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Creează Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creează Refund</DialogTitle>
                  <DialogDescription>
                    Creează un refund pentru o comandă specifică
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">ID Comandă</label>
                    <Input placeholder="Introdu ID-ul comenzii" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sumă (RON)</label>
                    <Input type="number" placeholder="0.00" step="0.01" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Motiv</label>
                    <Input placeholder="Motivul refund-ului" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Anulează</Button>
                    <Button onClick={onCreateRefund}>Creează Refund</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
                <SelectItem value="REFUNDED">Rambursat</SelectItem>
                <SelectItem value="FAILED">Eșuat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="ID Comandă"
              value={filters.orderId || ''}
              onChange={(e) => handleFilterChange('orderId', e.target.value || undefined)}
              className="w-40"
            />
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
                <TableHead scope="col">Motiv</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nu există refund-uri pentru filtrele selectate
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(refund.createdAt)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {refund.orderId.slice(-8)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(refund.amount, 'RON')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {refund.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getRefundStatusColor(refund.status)}
                      >
                        {getRefundStatusLabel(refund.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {refund.status === 'FAILED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRetryRefund?.(refund.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Detalii
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Sumar */}
        {refunds.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Refund-uri</div>
                <div className="font-medium">
                  {formatCurrency(
                    refunds.reduce((sum, r) => sum + r.amount, 0),
                    'RON'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Rambursate</div>
                <div className="font-medium text-green-600">
                  {refunds.filter(r => r.status === 'REFUNDED').length}
                </div>
              </div>
              <div>
                <div className="text-gray-600">În procesare</div>
                <div className="font-medium text-blue-600">
                  {refunds.filter(r => r.status === 'PROCESSING').length}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Eșuate</div>
                <div className="font-medium text-red-600">
                  {refunds.filter(r => r.status === 'FAILED').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
