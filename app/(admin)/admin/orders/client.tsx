"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, RefreshCw } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

type Row = {
  id: string;
  orderNumber: string;
  buyerEmail?: string | null;
  sellerName?: string | null;
  status: string;
  totalCents: number;
  currency: string;
  paymentRef?: string | null;
  createdAt: string | null;
};

function maskPaymentRef(ref: string): string {
  const v = ref.trim();
  if (!v) return "";
  if (v.length <= 4) return "****";
  return `****${v.slice(-4)}`;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Plătită' },
  { value: 'packed', label: 'Ambalată' },
  { value: 'shipped', label: 'Expediată' },
  { value: 'delivered', label: 'Livrată' },
  { value: 'canceled', label: 'Anulată' },
  { value: 'refunded', label: 'Rambursată' },
  { value: 'return_requested', label: 'Retur cerut' },
  { value: 'return_approved', label: 'Retur aprobat' },
  { value: 'returned', label: 'Returnată' },
];

function getStatusLabel(status: string): string {
  const statusObj = ORDER_STATUSES.find(s => s.value === status);
  return statusObj?.label || status;
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === 'delivered') return 'success';
  if (status === 'canceled' || status === 'refunded') return 'danger';
  if (status === 'paid' || status === 'packed' || status === 'shipped') return 'warning';
  if (status === 'return_requested' || status === 'return_approved') return 'warning';
  return 'neutral';
}

export default function AdminOrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  
  // Get initial values from URL
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("role", "admin");
      params.set("page", page.toString());
      if (search) params.set("q", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();
      setRows(data.data || []);
      setTotalItems(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Eroare la încărcarea comenzilor");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const url = `/api/admin/orders/export?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.error || "Export eșuat";
        throw new Error(msg);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `orders_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Export CSV error:", err);
      toast.error(err?.message || "Nu s-a putut exporta CSV");
    } finally {
      setExporting(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateFrom, dateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchOrders();
      } else {
        setPage(1); // Reset to page 1 when search changes
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Update URL when filters change (without triggering fetch)
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
    // Only update URL if it's different to avoid unnecessary navigation
    if (newUrl !== window.location.pathname + window.location.search) {
      router.replace(newUrl, { scroll: false });
    }
  }, [search, statusFilter, dateFrom, dateTo, page, router]);

  const columns: Column<Row>[] = [
    {
      key: "orderNumber",
      header: "Număr comandă",
      sortable: true,
      render: (r) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {r.orderNumber}
        </div>
      ),
    },
    {
      key: "buyerEmail",
      header: "Buyer",
      sortable: false,
      render: (r) => (
        <div className="text-slate-700 dark:text-slate-300 text-sm truncate max-w-[220px]" title={r.buyerEmail || undefined}>
          {r.buyerEmail || "-"}
        </div>
      ),
    },
    {
      key: "sellerName",
      header: "Seller",
      sortable: false,
      render: (r) => (
        <div className="text-slate-700 dark:text-slate-300 text-sm truncate max-w-[180px]" title={r.sellerName || undefined}>
          {r.sellerName || "-"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <Badge variant={getStatusVariant(r.status)}>
          {getStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: "totalCents",
      header: "Total",
      align: "right",
      sortable: true,
      render: (r) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {(r.totalCents / 100).toFixed(2)} {r.currency || 'RON'}
        </div>
      ),
    },
    {
      key: "paymentRef",
      header: "Payment ref",
      sortable: false,
      render: (r) => (
        <div className="text-slate-600 dark:text-slate-400 text-sm" title={r.paymentRef || undefined}>
          {r.paymentRef ? maskPaymentRef(r.paymentRef) : "-"}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Creată",
      sortable: true,
      render: (r) => (
        <div className="text-slate-600 dark:text-slate-400">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ro-RO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }) : '-'}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Acțiuni",
      align: "right",
      width: "100px",
      render: (r) => (
        <Link
          href={`/admin/orders/${r.id}`}
          className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          Vezi
        </Link>
      ),
    },
  ];

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  const handleDateFromClick = () => {
    if (dateFromRef.current) {
      dateFromRef.current.focus();
      if ('showPicker' in dateFromRef.current) {
        (dateFromRef.current as any).showPicker?.();
      }
    }
  };

  const handleDateToClick = () => {
    if (dateToRef.current) {
      dateToRef.current.focus();
      if ('showPicker' in dateToRef.current) {
        (dateToRef.current as any).showPicker?.();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Status Filter */}
        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Caută după număr comandă..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || exporting}
              className="h-10"
              title="Exportă CSV (PII mascat implicit)"
            >
              {exporting ? "Export..." : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="h-10"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualizează
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="dateFrom" className="text-sm font-medium text-slate-700 dark:text-slate-300 block cursor-pointer" onClick={handleDateFromClick}>
                De la data
              </label>
              <Input
                ref={dateFromRef}
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                onClick={handleDateFromClick}
                className="h-10 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dateTo" className="text-sm font-medium text-slate-700 dark:text-slate-300 block cursor-pointer" onClick={handleDateToClick}>
                Până la data
              </label>
              <Input
                ref={dateToRef}
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                onClick={handleDateToClick}
                className="h-10 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DataTable */}
      {loading && rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-base">Se încarcă comenzile...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl">
          <p className="text-base">Nu s-au găsit comenzi.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r: Row) => r.id}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                ariaLabel="Paginare comenzi admin"
              />
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-slate-500 text-center pt-2">
            Afișate {rows.length} din {totalItems} comenzi
          </div>
        </div>
      )}
    </div>
  );
}
