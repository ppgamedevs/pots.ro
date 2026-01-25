'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  XCircle,
  RotateCcw,
  Upload,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  orderId: string;
  orderNumber: string | null;
  type: 'commission' | 'seller' | 'platform';
  series: string;
  number: string;
  pdfUrl: string;
  total: string;
  currency: string;
  issuer: 'smartbill' | 'facturis' | 'mock' | 'seller';
  status: 'issued' | 'voided' | 'error';
  errorMessage: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  sellerInvoiceNumber: string | null;
  sellerId: string | null;
  sellerName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Stats {
  issued: number;
  voided: number;
  error: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<Stats>({ issued: 0, voided: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    issuer: '',
    q: '',
    from: '',
    to: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    orderId: '',
    sellerInvoiceNumber: '',
    total: '',
    file: null as File | null,
  });

  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '50',
      });
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.issuer) params.append('issuer', filters.issuer);
      if (filters.q) params.append('q', filters.q);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setInvoices(data.data || []);
        setPagination(data.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 0 });
        setStats(data.stats || { issued: 0, voided: 0, error: 0 });
      } else {
        toast.error(data.error || 'Failed to load invoices');
      }
    } catch {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleVoid = async () => {
    if (!selectedInvoice || !voidReason.trim()) {
      toast.error('Please provide a reason for voiding');
      return;
    }

    setActionLoading('void');
    try {
      const res = await fetch(`/api/admin/invoices/${selectedInvoice.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      });
      const data = await res.json();

      if (data.ok) {
        toast.success('Invoice voided successfully');
        setShowVoidModal(false);
        setSelectedInvoice(null);
        setVoidReason('');
        fetchInvoices(pagination.page);
      } else {
        toast.error(data.error || 'Failed to void invoice');
      }
    } catch {
      toast.error('Failed to void invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (invoice: Invoice) => {
    if (invoice.status !== 'error') {
      toast.error('Can only regenerate invoices with error status');
      return;
    }

    setActionLoading(`regenerate_${invoice.id}`);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.ok) {
        toast.success('Invoice regenerated successfully');
        fetchInvoices(pagination.page);
      } else {
        toast.error(data.error || 'Failed to regenerate invoice');
      }
    } catch {
      toast.error('Failed to regenerate invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.orderId || !uploadData.sellerInvoiceNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setActionLoading('upload');
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('orderId', uploadData.orderId);
      formData.append('sellerInvoiceNumber', uploadData.sellerInvoiceNumber);
      if (uploadData.total) formData.append('total', uploadData.total);

      const res = await fetch('/api/admin/invoices/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.ok) {
        toast.success('Seller invoice uploaded successfully');
        setShowUploadModal(false);
        setUploadData({ orderId: '', sellerInvoiceNumber: '', total: '', file: null });
        fetchInvoices(pagination.page);
      } else {
        toast.error(data.error || 'Failed to upload invoice');
      }
    } catch {
      toast.error('Failed to upload invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Issued</span>;
      case 'voided':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800"><XCircle className="h-3 w-3" /> Voided</span>;
      case 'error':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3" /> Error</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'commission':
        return <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">Commission</span>;
      case 'seller':
        return <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">Seller</span>;
      case 'platform':
        return <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Platform</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/admin/finante"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Finanțe
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Manage platform, commission, and seller invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Upload className="h-4 w-4" />
            Upload Seller Invoice
          </button>
          <button
            onClick={() => fetchInvoices(pagination.page)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.issued}</div>
          <div className="text-sm text-gray-600">Issued</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.voided}</div>
          <div className="text-sm text-gray-600">Voided</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number, order number..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices(1)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg ${
              showFilters ? 'bg-indigo-50 border-indigo-300' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={() => fetchInvoices(1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="commission">Commission</option>
                <option value="seller">Seller</option>
                <option value="platform">Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="issued">Issued</option>
                <option value="voided">Voided</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
              <select
                value={filters.issuer}
                onChange={(e) => setFilters({ ...filters, issuer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Issuers</option>
                <option value="smartbill">SmartBill</option>
                <option value="facturis">Facturis</option>
                <option value="mock">Mock</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-600">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Issuer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Seller</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{invoice.series}-{invoice.number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/orders/${invoice.orderId}`}
                        className="text-blue-600 hover:underline font-mono text-xs"
                      >
                        {invoice.orderNumber || invoice.orderId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(invoice.type)}</td>
                    <td className="py-3 px-4 capitalize">{invoice.issuer}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(invoice.status)}
                      {invoice.status === 'error' && invoice.errorMessage && (
                        <div className="mt-1 text-xs text-red-600 truncate max-w-[150px]" title={invoice.errorMessage}>
                          {invoice.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {invoice.total} {invoice.currency}
                    </td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-[120px]">
                      {invoice.sellerName || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={invoice.pdfUrl}
                          download
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {invoice.status === 'error' && invoice.issuer !== 'seller' && (
                          <button
                            onClick={() => handleRegenerate(invoice)}
                            disabled={actionLoading === `regenerate_${invoice.id}`}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                            title="Regenerate"
                          >
                            <RotateCcw className={`h-4 w-4 ${actionLoading === `regenerate_${invoice.id}` ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {invoice.status === 'issued' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowVoidModal(true);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Void"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInvoices(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchInvoices(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Void Modal */}
      {showVoidModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Void Invoice</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to void invoice <strong>{selectedInvoice.series}-{selectedInvoice.number}</strong>?
              This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for voiding <span className="text-red-500">*</span>
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Provide a reason for voiding this invoice..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setSelectedInvoice(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || actionLoading === 'void'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'void' ? 'Voiding...' : 'Void Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Seller Invoice</h3>
            <form onSubmit={handleUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadData.orderId}
                    onChange={(e) => setUploadData({ ...uploadData, orderId: e.target.value })}
                    placeholder="UUID of the order"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadData.sellerInvoiceNumber}
                    onChange={(e) => setUploadData({ ...uploadData, sellerInvoiceNumber: e.target.value })}
                    placeholder="e.g., FACT-2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadData.total}
                    onChange={(e) => setUploadData({ ...uploadData, total: e.target.value })}
                    placeholder="e.g., 150.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, JPEG, PNG (max 10MB)</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ orderId: '', sellerInvoiceNumber: '', total: '', file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'upload'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === 'upload' ? 'Uploading...' : 'Upload Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
