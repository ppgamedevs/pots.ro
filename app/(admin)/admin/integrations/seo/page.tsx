'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Play,
  Search,
  Send,
  Clock,
} from 'lucide-react';

interface SitemapEndpoint {
  name: string;
  path: string;
  fullUrl: string;
  type: string;
  urlCount?: number | null;
}

interface SEOStatus {
  baseUrl: string;
  lastRegenAt: string | null;
  lastPingAt: string | null;
  sitemapEndpoints: SitemapEndpoint[];
  robotsInfo: {
    path: string;
    fullUrl: string;
    sitemapReference: string;
    note: string;
  };
  summary: {
    totalUrls: number;
    products: number;
    categories: number;
    sellers: number;
  };
}

interface ValidationResult {
  type: string;
  path: string;
  status: number | null;
  ok: boolean;
  hasCanonical: boolean | null;
  robotsAllowed: boolean | null;
  error?: string;
}

export default function SEOIntegrationPage() {
  const [status, setStatus] = useState<SEOStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations/seo/status');
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch SEO status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRegenerate = async () => {
    setActionLoading('regenerate');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/seo/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({
          type: 'success',
          message: data.message,
        });
        fetchStatus();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to regenerate sitemaps' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidate = async () => {
    setActionLoading('validate');
    setActionResult(null);
    setShowValidation(true);
    try {
      const res = await fetch('/api/admin/integrations/seo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleSize: 10 }),
      });
      const data = await res.json();
      if (data.ok) {
        setValidationResults(data.results);
        setActionResult({
          type: data.summary.failed === 0 ? 'success' : 'error',
          message: data.message,
        });
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to validate URLs' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePing = async () => {
    setActionLoading('ping');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/seo/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engines: ['google', 'bing'] }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({
          type: 'success',
          message: data.message,
        });
        fetchStatus();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to ping search engines' });
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
          <h1 className="text-2xl font-bold text-gray-900">SEO / Sitemaps</h1>
          <p className="text-gray-600 mt-1">Sitemap status, regeneration, validation, and search engine ping</p>
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

      {/* Summary Stats */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{status.summary.totalUrls}</p>
            <p className="text-sm text-gray-600">Total URLs</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{status.summary.products}</p>
            <p className="text-sm text-gray-600">Products</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{status.summary.categories}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{status.summary.sellers}</p>
            <p className="text-sm text-gray-600">Sellers</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap Endpoints */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sitemap Endpoints
          </h2>
          <div className="space-y-3">
            {status?.sitemapEndpoints.map((ep) => (
              <div key={ep.path} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm">{ep.name}</p>
                  <code className="text-xs text-gray-500">{ep.path}</code>
                </div>
                <div className="flex items-center gap-2">
                  {ep.urlCount !== null && ep.urlCount !== undefined && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{ep.urlCount} URLs</span>
                  )}
                  <a
                    href={ep.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleRegenerate}
              disabled={actionLoading === 'regenerate'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === 'regenerate' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Regenerate Sitemaps
            </button>

            <button
              onClick={handleValidate}
              disabled={actionLoading === 'validate'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === 'validate' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Validate URLs
            </button>

            <button
              onClick={handlePing}
              disabled={actionLoading === 'ping'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === 'ping' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ping Search Engines
            </button>
          </div>

          {/* Last Run Info */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last Regen:</span>
              <span className="font-mono">
                {status?.lastRegenAt ? new Date(status.lastRegenAt).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Send className="h-4 w-4" />
              <span>Last Ping:</span>
              <span className="font-mono">
                {status?.lastPingAt ? new Date(status.lastPingAt).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Robots.txt Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Robots.txt
          </h2>
          {status && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Path:</span>
                <code className="text-sm">{status.robotsInfo.path}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sitemap Reference:</span>
                <code className="text-xs break-all">{status.robotsInfo.sitemapReference}</code>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{status.robotsInfo.note}</p>
              <a
                href={status.robotsInfo.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                View robots.txt <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Base URL Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Base URL:</p>
              <code className="text-sm font-mono">{status?.baseUrl}</code>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs text-amber-800">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Ensure this matches your production domain. Sitemap URLs are generated from this base.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {showValidation && validationResults && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">URL Validation Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 font-medium text-gray-600">Path</th>
                  <th className="text-left py-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 font-medium text-gray-600">Canonical</th>
                  <th className="text-left py-2 font-medium text-gray-600">Robots</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{r.type}</span>
                    </td>
                    <td className="py-2 font-mono text-xs">{r.path}</td>
                    <td className="py-2">
                      {r.ok ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> {r.status}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> {r.status || 'Error'}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.hasCanonical === true ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : r.hasCanonical === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.robotsAllowed === true ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : r.robotsAllowed === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
