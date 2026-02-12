'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  RotateCcw,
  FileText,
  Clock,
  ExternalLink,
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

interface InvoicingStatus {
  activeProvider: string;
  mode: 'sandbox' | 'production';
  health: {
    isHealthy: boolean;
    errorRate: string;
    pendingErrors: number;
  };
  smartbill: Record<string, EnvVarStatus>;
  facturis: Record<string, EnvVarStatus>;
  stats: {
    total: number;
    issued: number;
    voided: number;
    errors: number;
    byIssuer: Record<string, number>;
    issuedLast24h: number;
    issuedLast7d: number;
  };
  recentErrors: Array<{
    id: string;
    orderId: string;
    type: string;
    issuer: string;
    errorMessage: string | null;
    createdAt: string | null;
  }>;
  recentInvoices: Array<{
    id: string;
    orderId: string;
    type: string;
    series: string;
    number: string;
    issuer: string;
    status: string;
    total: string;
    currency: string;
    createdAt: string | null;
  }>;
}

type PaidOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalCents: number;
  createdAt: string;
};

export default function InvoicingIntegrationPage() {
  const [status, setStatus] = useState<InvoicingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [paidOrders, setPaidOrders] = useState<PaidOrderRow[]>([]);
  const [paidOrdersLoading, setPaidOrdersLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations/invoicing/status');
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

      // Open receipt PDF in new tab
      if (data.receipt?.pdfUrl) {
        window.open(data.receipt.pdfUrl, '_blank');
        toast.success(`Receipt ${data.receipt.series}-${data.receipt.number} generated successfully`);
      } else {
        toast.success('Receipt generated successfully');
      }
    } catch (err: any) {
      console.error('Receipt generation error:', err);
      toast.error(err?.message || 'Failed to generate receipt');
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const handleTestConnection = async () => {
    setActionLoading('test');
    setActionResult(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/integrations/invoicing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult(data.result);
      if (data.ok) {
        setActionResult({ type: 'success', message: data.result.message });
      } else {
        setActionResult({ type: 'error', message: data.result?.message || data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to test connection' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateKeys = async () => {
    if (!showRotateConfirm) {
      setShowRotateConfirm(true);
      return;
    }

    setActionLoading('rotate');
    setActionResult(null);
    setShowRotateConfirm(false);

    try {
      const res = await fetch('/api/admin/integrations/invoicing/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: status?.activeProvider, confirm: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({ type: 'success', message: data.message });
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to rotate keys' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading('retry');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/invoicing/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({
          type: 'success',
          message: `Found ${data.queued} invoices eligible for retry. ${data.skipped} skipped.`,
        });
        // Refresh status after retry
        setTimeout(fetchStatus, 1000);
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to queue retries' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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

  const activeEnvVars = status?.activeProvider === 'smartbill' ? status?.smartbill : status?.facturis;
  const allEnvConfigured = activeEnvVars && Object.values(activeEnvVars).filter(v => v.isSensitive).every(v => v.configured);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Integrations
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoicing Integration</h1>
          <p className="text-gray-600 mt-1">
            Provider: <span className="font-semibold capitalize">{status?.activeProvider || 'mock'}</span>
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

      {/* Action Result Banner */}
      {actionResult && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            actionResult.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {actionResult.message}
        </div>
      )}

      {/* Rotate Confirmation Dialog */}
      {showRotateConfirm && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">⚠️ Rotate API Credentials?</p>
          <p className="text-amber-700 text-sm mt-1">
            This will log a rotation request. You&apos;ll need to manually update environment variables in Vercel.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRotateKeys}
              className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
            >
              Confirm Rotation
            </button>
            <button
              onClick={() => setShowRotateConfirm(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
        {/* Health & Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {status?.health.isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            Health Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Provider Status</span>
              <span className={`text-sm font-medium ${status?.health.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {status?.health.isHealthy ? 'Healthy' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Error Rate</span>
              <span className="text-sm font-mono">{status?.health.errorRate || '0.00'}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Pending Errors</span>
              <span className={`text-sm font-medium ${
                (status?.health.pendingErrors || 0) > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {status?.health.pendingErrors || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Issued (24h)</span>
              <span className="text-sm font-medium">{status?.stats.issuedLast24h || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Issued (7d)</span>
              <span className="text-sm font-medium">{status?.stats.issuedLast7d || 0}</span>
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
            Environment Variables ({status?.activeProvider || 'mock'})
          </h2>
          <div className="space-y-3">
            {activeEnvVars &&
              Object.entries(activeEnvVars).map(([name, info]) => (
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
            {status?.activeProvider === 'mock' && (
              <p className="text-sm text-gray-500 italic">
                Mock provider is active. No credentials required.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={actionLoading === 'test'}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" />
                <span>Test Connection</span>
              </div>
              {actionLoading === 'test' && <RefreshCw className="h-4 w-4 animate-spin" />}
            </button>

            {testResult && (
              <div className={`px-4 py-2 rounded-lg text-sm ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{testResult.message}</span>
                  <span className="text-xs opacity-75">{testResult.latencyMs}ms</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRetryFailed}
              disabled={actionLoading === 'retry' || (status?.health.pendingErrors || 0) === 0}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-600" />
                <span>Retry Failed Invoices ({status?.health.pendingErrors || 0})</span>
              </div>
              {actionLoading === 'retry' && <RefreshCw className="h-4 w-4 animate-spin" />}
            </button>

            <button
              onClick={handleRotateKeys}
              disabled={actionLoading === 'rotate' || status?.activeProvider === 'mock'}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>Rotate Credentials</span>
              </div>
              {actionLoading === 'rotate' && <RefreshCw className="h-4 w-4 animate-spin" />}
            </button>

            <Link
              href="/admin/finante/invoices"
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>View All Invoices</span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* By Issuer Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Invoices by Issuer</h2>
          <div className="space-y-3">
            {status?.stats.byIssuer && Object.entries(status.stats.byIssuer).map(([issuer, count]) => (
              <div key={issuer} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 capitalize">{issuer}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
            {(!status?.stats.byIssuer || Object.keys(status.stats.byIssuer).length === 0) && (
              <p className="text-sm text-gray-500 italic">No invoices yet</p>
            )}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Errors */}
      {status?.recentErrors && status.recentErrors.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Recent Errors
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Order</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Issuer</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Error</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Date</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {status.recentErrors.map((err) => (
                  <tr key={err.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">
                      <Link href={`/admin/orders/${err.orderId}`} className="text-blue-600 hover:underline font-mono text-xs">
                        {err.orderId.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-2 px-2 capitalize">{err.type}</td>
                    <td className="py-2 px-2 capitalize">{err.issuer}</td>
                    <td className="py-2 px-2 text-red-600 truncate max-w-[200px]" title={err.errorMessage || ''}>
                      {err.errorMessage || 'Unknown error'}
                    </td>
                    <td className="py-2 px-2 text-gray-500">
                      {err.createdAt ? new Date(err.createdAt).toLocaleDateString('ro-RO') : '-'}
                    </td>
                    <td className="py-2 px-2">
                      <Link
                        href={`/admin/finante/invoices?id=${err.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          Recent Invoices
        </h2>
        {status?.recentInvoices && status.recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Invoice</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Issuer</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Total</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {status.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2 font-mono">{inv.series}-{inv.number}</td>
                    <td className="py-2 px-2 capitalize">{inv.type}</td>
                    <td className="py-2 px-2 capitalize">{inv.issuer}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                        inv.status === 'issued' ? 'bg-green-100 text-green-800' :
                        inv.status === 'voided' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">{inv.total} {inv.currency}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ro-RO') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No invoices yet</p>
        )}
      </div>
    </div>
  );
}
