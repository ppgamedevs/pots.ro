'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Receipt,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/money';

interface EnvVarStatus {
  configured: boolean;
  fingerprint: string | null;
  isSensitive: boolean;
}

interface SmartBillStatus {
  configured: boolean;
  mode: 'sandbox' | 'production';
  apiBase: string;
  connectionStatus: 'healthy' | 'unhealthy' | 'not_configured';
  envVars: Record<string, EnvVarStatus>;
  stats: {
    total: number;
    issued: number;
    voided: number;
    errors: number;
  };
}

type PaidOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalCents: number;
  createdAt: string;
  receipt: {
    id: string;
    series: string;
    number: string;
    pdfUrl: string;
    status: string;
  } | null;
};

export default function SmartBillPage() {
  const [status, setStatus] = useState<SmartBillStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paidOrders, setPaidOrders] = useState<PaidOrderRow[]>([]);
  const [paidOrdersLoading, setPaidOrdersLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/smartbill/status');
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchPaidOrders();
  }, []);

  const fetchPaidOrders = async () => {
    try {
      setPaidOrdersLoading(true);
      const res = await fetch('/api/admin/payments?status=paid&pageSize=50', { credentials: 'include' });
      const data = await res.json();
      console.log('Paid orders API response:', { res: { ok: res.ok, status: res.status }, data });
      if (res.ok && data.data) {
        console.log('Setting paid orders:', data.data.length, 'orders');
        setPaidOrders(data.data || []);
      } else {
        console.error('Failed to fetch paid orders:', data.error || 'Unknown error');
        setPaidOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch paid orders:', err);
      setPaidOrders([]);
    } finally {
      setPaidOrdersLoading(false);
    }
  };

  const handleGenerateReceipt = async (orderId: string) => {
    try {
      setGeneratingReceipt(orderId);
      const res = await fetch('/api/admin/integrations/invoicing/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        credentials: 'include',
      });
      const data = await res.json();
      
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to generate receipt');
      }

      toast.success(`Chitanță ${data.receipt.series}-${data.receipt.number} generată cu succes`);
      
      // Refresh list to display the newly generated receipt
      await fetchPaidOrders();
    } catch (err: any) {
      console.error('Receipt generation error:', err);
      toast.error(err?.message || 'Failed to generate receipt');
    } finally {
      setGeneratingReceipt(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const allEnvConfigured = status?.envVars && Object.values(status.envVars)
    .filter(v => v.isSensitive)
    .every(v => v.configured);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SmartBill</h1>
          <p className="text-gray-600 mt-1">
            SmartBill API configuration and status
            {status?.mode && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                status.mode === 'production' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {status.mode}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{status?.stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total Invoices</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{status?.stats.issued || 0}</div>
          <div className="text-sm text-gray-600">Issued</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{status?.stats.voided || 0}</div>
          <div className="text-sm text-gray-600">Voided</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{status?.stats.errors || 0}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {status?.configured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Configuration Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">API Base URL</span>
              <span className="text-sm font-mono text-gray-600">{status?.apiBase || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Mode</span>
              <span className={`text-sm font-medium ${
                status?.mode === 'production' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {status?.mode || 'sandbox'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Connection Status</span>
              <span className={`text-sm font-medium ${
                status?.connectionStatus === 'healthy' ? 'text-green-600' :
                status?.connectionStatus === 'unhealthy' ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {status?.connectionStatus === 'healthy' ? 'Healthy' :
                 status?.connectionStatus === 'unhealthy' ? 'Unhealthy' :
                 'Not Configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {allEnvConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Environment Variables
          </h2>
          <div className="space-y-3">
            {status?.envVars && Object.entries(status.envVars).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {info.configured ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <code className="text-sm text-gray-700">{name}</code>
                  {info.isSensitive && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">secret</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {info.configured ? (
                    info.isSensitive ? (
                      <span className="font-mono">fp:{info.fingerprint}</span>
                    ) : (
                      <span className="font-mono truncate max-w-[150px]">{info.fingerprint}</span>
                    )
                  ) : (
                    <span className="text-red-500">Not configured</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paid Orders Table */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-500" />
            Plăți Finalizate (Paid Orders)
          </h2>
          <button
            onClick={fetchPaidOrders}
            disabled={paidOrdersLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${paidOrdersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {paidOrdersLoading ? (
          <div className="py-8 text-center text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Se încarcă...</p>
          </div>
        ) : paidOrders.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nu există comenzi plătite</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Număr comandă</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Sumă</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Chitanță</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">
                      <Link 
                        href={`/admin/orders/${order.id}`} 
                        className="text-blue-600 hover:underline font-mono text-xs"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="text-xs text-gray-500 ml-2">({order.id.slice(-8)})</span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {formatCurrency((order.totalCents || 0) / 100, order.currency || 'RON')}
                    </td>
                    <td className="py-2 px-2">
                      {order.receipt ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600">
                            {order.receipt.series}-{order.receipt.number}
                          </span>
                          <a
                            href={`/api/invoices/${order.receipt.id}/pdf`}
                            download
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <FileText className="h-3 w-3" />
                            Descarcă PDF
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateReceipt(order.id)}
                          disabled={generatingReceipt === order.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingReceipt === order.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generare...
                            </>
                          ) : (
                            <>
                              <Receipt className="h-3 w-3" />
                              Generează chitanță
                            </>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {/* Acțiuni column - can be used for other actions if needed */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
