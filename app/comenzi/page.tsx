"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/session';
import { ShoppingBag, ArrowLeft, Clock, CheckCircle, Package, Truck, AlertCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

const statusConfig = {
  pending: { 
    label: 'În așteptare', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    badgeColor: 'bg-yellow-500'
  },
  paid: { 
    label: 'Plătită', 
    icon: CheckCircle, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    badgeColor: 'bg-blue-500'
  },
  packed: { 
    label: 'Pregătită', 
    icon: Package, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    badgeColor: 'bg-purple-500'
  },
  shipped: { 
    label: 'Expediată', 
    icon: Truck, 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    badgeColor: 'bg-orange-500'
  },
  delivered: { 
    label: 'Livrată', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    badgeColor: 'bg-green-500'
  },
  canceled: { 
    label: 'Anulată', 
    icon: AlertCircle, 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    badgeColor: 'bg-red-500'
  }
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/orders?role=buyer', fetcher);

  const formatPrice = (cents: number, currency: string = 'RON') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleRetryPayment = (orderId: string) => {
    router.push(`/finalizare/pay?order_id=${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">Se încarcă comenzile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Eroare la încărcarea comenzilor
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Nu s-au putut încărca comenzile. Te rugăm să încerci din nou.
            </p>
            <Button onClick={() => window.location.reload()}>
              Încearcă din nou
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orders = data?.data || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/account" 
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la contul meu
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Comenzile mele
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Istoricul comenzilor tale și statusul lor
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Nu ai comenzi încă
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Începe să explorezi produsele noastre și plasează prima ta comandă.
              </p>
              <Link 
                href="/cautare"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                Descoperă produse
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div 
                  key={order.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Comandă #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Plasată pe {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatPrice(order.totalCents, order.currency)}
                      </p>
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CreditCard className="h-4 w-4" />
                          <span>Plata este în așteptare</span>
                        </div>
                        <Button
                          onClick={() => handleRetryPayment(order.id)}
                          size="sm"
                          variant="outline"
                        >
                          Reîncearcă plata
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Link 
                      href={`/comenzile-mele/${order.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Vezi detalii comandă →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
