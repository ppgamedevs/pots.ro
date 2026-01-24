'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  HardDrive,
  Image,
  FileText,
  Archive,
  AlertTriangle,
  Shield,
  Trash2,
  Link2,
  Search,
} from 'lucide-react';

interface UsageStats {
  productImages: {
    total: number;
    byStatus: { approved: number; pending: number; rejected: number };
    quarantined: number;
  };
  kycDocuments: {
    total: number;
    byStatus: { uploaded: number; approved: number; rejected: number };
  };
  backups: {
    total: number;
    success: number;
    failed: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
  };
  summary: {
    totalTrackedFiles: number;
    quarantinedFiles: number;
  };
}

interface OrphanCandidate {
  id: number;
  productId: number;
  url: string;
  status: string;
  error: string | null;
  createdAt: string | null;
}

interface QuarantinedFile {
  id: number;
  productId: number;
  urlPreview: string | null;
  reason: string | null;
  status: string | null;
  createdAt: string | null;
}

export default function StorageIntegrationPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [orphans, setOrphans] = useState<OrphanCandidate[]>([]);
  const [quarantined, setQuarantined] = useState<QuarantinedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'orphans' | 'quarantine'>('usage');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [signedUrlPath, setSignedUrlPath] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/admin/integrations/storage/usage');
      const data = await res.json();
      if (data.ok) {
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const fetchOrphans = async () => {
    try {
      const res = await fetch('/api/admin/integrations/storage/orphans?limit=30');
      const data = await res.json();
      if (data.ok) {
        setOrphans(data.orphans.candidates);
      }
    } catch (err) {
      console.error('Failed to fetch orphans:', err);
    }
  };

  const fetchQuarantined = async () => {
    try {
      const res = await fetch('/api/admin/integrations/storage/quarantine?limit=50');
      const data = await res.json();
      if (data.ok) {
        setQuarantined(data.quarantined);
      }
    } catch (err) {
      console.error('Failed to fetch quarantined:', err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsage(), fetchOrphans(), fetchQuarantined()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCleanup = async (imageIds: number[], dryRun: boolean) => {
    setActionLoading('cleanup');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/storage/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, dryRun }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({
          type: 'success',
          message: data.message,
        });
        if (!dryRun) {
          fetchOrphans();
          fetchUsage();
        }
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to run cleanup' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuarantineAction = async (imageIds: number[], action: 'quarantine' | 'unquarantine') => {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/storage/quarantine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, action, reason: 'Admin action' }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult({ type: 'success', message: data.message });
        fetchQuarantined();
        fetchUsage();
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to update quarantine status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSignedUrl = async () => {
    if (!signedUrlPath.trim()) return;
    setActionLoading('signed-url');
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/integrations/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: signedUrlPath, expiresIn: 300 }),
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedUrl(data.signedUrl);
        setActionResult({ type: 'success', message: `URL generated (expires ${data.expiresIn}s)` });
      } else {
        setActionResult({ type: 'error', message: data.error });
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to generate URL' });
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
          <h1 className="text-2xl font-bold text-gray-900">Storage / Blob</h1>
          <p className="text-gray-600 mt-1">File usage, orphan detection, quarantine management</p>
        </div>
        <button
          onClick={fetchAll}
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {[
            { id: 'usage', label: 'Usage Overview', icon: HardDrive },
            { id: 'orphans', label: 'Orphan Detection', icon: Search },
            { id: 'quarantine', label: 'Quarantine', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Usage Tab */}
      {activeTab === 'usage' && usage && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Image className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold">Product Images</h3>
              </div>
              <p className="text-3xl font-bold">{usage.productImages.total}</p>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>✓ Approved: {usage.productImages.byStatus.approved}</p>
                <p>⏳ Pending: {usage.productImages.byStatus.pending}</p>
                <p>✗ Rejected: {usage.productImages.byStatus.rejected}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold">KYC Documents</h3>
              </div>
              <p className="text-3xl font-bold">{usage.kycDocuments.total}</p>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>📤 Uploaded: {usage.kycDocuments.byStatus.uploaded}</p>
                <p>✓ Approved: {usage.kycDocuments.byStatus.approved}</p>
                <p>✗ Rejected: {usage.kycDocuments.byStatus.rejected}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Archive className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold">Backups</h3>
              </div>
              <p className="text-3xl font-bold">{usage.backups.total}</p>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>✓ Success: {usage.backups.success}</p>
                <p>✗ Failed: {usage.backups.failed}</p>
                <p>📦 Size: {usage.backups.totalSizeFormatted}</p>
              </div>
            </div>
          </div>

          {/* Quarantine Alert */}
          {usage.summary.quarantinedFiles > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">
                <strong>{usage.summary.quarantinedFiles}</strong> files are currently quarantined.
                <button
                  onClick={() => setActiveTab('quarantine')}
                  className="ml-2 underline hover:no-underline"
                >
                  Review →
                </button>
              </p>
            </div>
          )}

          {/* Signed URL Generator */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Generate Signed URL
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={signedUrlPath}
                onChange={(e) => setSignedUrlPath(e.target.value)}
                placeholder="Enter file path (e.g., backups/db-2024-01-01.sql)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleGenerateSignedUrl}
                disabled={actionLoading === 'signed-url' || !signedUrlPath.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Generate
              </button>
            </div>
            {generatedUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <p className="text-gray-600 mb-1">Signed URL (5 min expiry):</p>
                <code className="break-all text-xs">{generatedUrl}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orphans Tab */}
      {activeTab === 'orphans' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Orphan Candidates</h3>
                <p className="text-sm text-gray-600">
                  DB records referencing blobs that may not exist (sample-based scan)
                </p>
              </div>
              <button
                onClick={fetchOrphans}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Rescan
              </button>
            </div>

            {orphans.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">No orphan candidates found in this sample</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-600">ID</th>
                        <th className="text-left py-2 font-medium text-gray-600">Product ID</th>
                        <th className="text-left py-2 font-medium text-gray-600">Status</th>
                        <th className="text-left py-2 font-medium text-gray-600">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orphans.map((o) => (
                        <tr key={o.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-2">{o.id}</td>
                          <td className="py-2">{o.productId}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{o.status}</span>
                          </td>
                          <td className="py-2 text-red-600 text-xs">{o.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleCleanup(orphans.map((o) => o.id), true)}
                    disabled={actionLoading === 'cleanup'}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Preview Cleanup
                  </button>
                  <button
                    onClick={() => handleCleanup(orphans.map((o) => o.id), false)}
                    disabled={actionLoading === 'cleanup'}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete Orphans
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quarantine Tab */}
      {activeTab === 'quarantine' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Quarantined Files</h3>
                <p className="text-sm text-gray-600">Files blocked from downloads pending review</p>
              </div>
            </div>

            {quarantined.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">No quarantined files</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">ID</th>
                      <th className="text-left py-2 font-medium text-gray-600">Product</th>
                      <th className="text-left py-2 font-medium text-gray-600">Reason</th>
                      <th className="text-left py-2 font-medium text-gray-600">Date</th>
                      <th className="text-left py-2 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarantined.map((f) => (
                      <tr key={f.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2">{f.id}</td>
                        <td className="py-2">{f.productId}</td>
                        <td className="py-2 text-xs text-gray-600">{f.reason || '-'}</td>
                        <td className="py-2 text-xs text-gray-600">
                          {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => handleQuarantineAction([f.id], 'unquarantine')}
                            disabled={!!actionLoading}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
