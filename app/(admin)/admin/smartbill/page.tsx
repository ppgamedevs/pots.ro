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
} from 'lucide-react';

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

export default function SmartBillPage() {
  const [status, setStatus] = useState<SmartBillStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
    </div>
  );
}
