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
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Copy,
  Clock,
} from 'lucide-react';

interface EnvVarStatus {
  configured: boolean;
  fingerprint: string | null;
}

interface NetopiaStatus {
  envVars: Record<string, EnvVarStatus>;
  callbackUrls: {
    ipnCallback: string;
    returnUrl: string;
    cancelUrl: string;
  };
  mode: 'sandbox' | 'production';
  stats: {
    eventsLast24h: number;
    eventsLast7d: number;
  };
  recentEvents: Array<{
    id: string;
    source: string;
    eventType: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
}

export default function NetopiaConfigPage() {
  const [status, setStatus] = useState<NetopiaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations/netopia/status');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setActionResult({ type: 'success', message: 'Copied to clipboard!' });
    setTimeout(() => setActionResult(null), 2000);
  };

  const handleTestCallback = async () => {
    setActionLoading('test');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/netopia/test-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({
          type: 'success',
          message: `Test completed. Callback reachable: ${data.diagnostics.callbackReachable ? 'Yes' : 'No'}`,
        });
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to run test' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeToggle = async () => {
    if (!status) return;
    const newMode = status.mode === 'sandbox' ? 'production' : 'sandbox';

    if (newMode === 'production' && !showModeConfirm) {
      setShowModeConfirm(true);
      return;
    }

    setActionLoading('mode');
    setActionResult(null);
    setShowModeConfirm(false);

    try {
      const res = await fetch('/api/admin/integrations/netopia/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: newMode,
          confirm: true,
          previousMode: status.mode,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({ type: 'success', message: `Mode switched to ${newMode}` });
        fetchStatus();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to change mode' });
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
      const res = await fetch('/api/admin/integrations/netopia/rotate-keyset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({ type: 'success', message: data.message });
        fetchStatus();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to rotate keys' });
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

  const allEnvConfigured = status && Object.values(status.envVars).every((v) => v.configured);

  return (
    <div className="p-6 max-w-5xl">
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
          <h1 className="text-2xl font-bold text-gray-900">Netopia Payments</h1>
          <p className="text-gray-600 mt-1">Configuration status, callbacks, and operational controls</p>
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

      {/* Mode Confirmation Dialog */}
      {showModeConfirm && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">⚠️ Switch to Production Mode?</p>
          <p className="text-amber-700 text-sm mt-1">
            This will process real payments. Make sure your Netopia credentials are production-ready.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleModeToggle}
              className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
            >
              Confirm Switch
            </button>
            <button
              onClick={() => setShowModeConfirm(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rotate Confirmation Dialog */}
      {showRotateConfirm && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">⚠️ Rotate API Keys?</p>
          <p className="text-amber-700 text-sm mt-1">
            This will switch to the "next" keyset. Ensure NETOPIA_SIGNATURE_NEXT and NETOPIA_API_KEY_NEXT are provisioned.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {status &&
              Object.entries(status.envVars).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    {info.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <code className="text-sm text-gray-700">{name}</code>
                  </div>
                  <div className="text-xs text-gray-500">
                    {info.configured ? (
                      <span className="font-mono">fp:{info.fingerprint}</span>
                    ) : (
                      <span className="text-red-500">Not configured</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Mode & Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Mode & Actions</h2>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium">Current Mode</p>
              <p className="text-sm text-gray-600">
                {status?.mode === 'production' ? 'Processing real payments' : 'Testing environment'}
              </p>
            </div>
            <button
              onClick={handleModeToggle}
              disabled={actionLoading === 'mode'}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                status?.mode === 'production'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status?.mode === 'production' ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {status?.mode === 'production' ? 'Production' : 'Sandbox'}
            </button>
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-3">
            <button
              onClick={handleTestCallback}
              disabled={actionLoading === 'test'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === 'test' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Test Callback
            </button>
            <button
              onClick={handleRotateKeys}
              disabled={actionLoading === 'rotate'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === 'rotate' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Rotate Keys
            </button>
          </div>
        </div>

        {/* Callback URLs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Callback URLs</h2>
          <p className="text-sm text-gray-600 mb-4">Configure these in your Netopia merchant dashboard:</p>
          <div className="space-y-3">
            {status &&
              Object.entries(status.callbackUrls).map(([name, url]) => (
                <div key={name} className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{name}</p>
                    <code className="text-xs text-gray-600 break-all">{url}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(url)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Event Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Event Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{status?.stats.eventsLast24h ?? 0}</p>
              <p className="text-sm text-gray-600">Last 24 hours</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{status?.stats.eventsLast7d ?? 0}</p>
              <p className="text-sm text-gray-600">Last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Events</h2>
          <Link
            href="/admin/webhooks"
            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            View all webhooks <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        {status?.recentEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent events</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">ID</th>
                  <th className="text-left py-2 font-medium text-gray-600">Event Type</th>
                  <th className="text-left py-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {status?.recentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-mono text-xs">{event.id.slice(0, 8)}...</td>
                    <td className="py-2">{event.eventType || '-'}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          event.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {event.createdAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
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
