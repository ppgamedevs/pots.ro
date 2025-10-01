'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderDetail, OrderStatus } from '@/lib/types';
import { EyeIcon, MessageSquareIcon, PackageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrdersTableProps {
  orders: OrderDetail[];
  role: 'seller' | 'admin';
  unreadCountByOrderId?: Record<string, number>;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Canceled',
  refunded: 'Refunded',
};

export function OrdersTable({ 
  orders, 
  role, 
  unreadCountByOrderId = {},
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  isLoading = false
}: OrdersTableProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(cents / 100);
  };

  const formatOrderId = (id: string) => {
    return `#${id.slice(-8).toUpperCase()}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link 
                      href={`/${role}/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {formatOrderId(order.id)}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {formatCurrency(order.totals.total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={STATUS_COLORS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {unreadCountByOrderId[order.id] > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <MessageSquareIcon className="h-3 w-3" />
                        {unreadCountByOrderId[order.id]}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/${role}/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {order.awbLabelUrl && (
                        <Button variant="outline" size="sm">
                          <PackageIcon className="h-4 w-4 mr-1" />
                          Label
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
