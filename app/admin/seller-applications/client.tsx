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
  company: string;
  cui: string | null;
  email: string;
  status: string;
  createdAt: string | null;
};

function slugifyCompany(input: string | null | undefined): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'aplicatie';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: 'Primită',
    in_review: 'În review',
    need_info: 'Necesită informații',
    approved: 'Aprobată',
    rejected: 'Respinsă',
  };
  return labels[status] || status;
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'in_review') return 'warning';
  if (status === 'need_info') return 'warning';
  return 'neutral';
}

export default function AdminSellerApplicationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  
  // Get initial values from URL
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (search) params.set("q", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/seller/applications?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await res.json();
      setRows(data.items || []);
      setTotalItems(data.meta?.totalItems || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Eroare la încărcarea aplicațiilor");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateFrom, dateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchApplications();
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
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `/admin/seller-applications${params.toString() ? `?${params.toString()}` : ""}`;
    // Only update URL if it's different to avoid unnecessary navigation
    if (newUrl !== window.location.pathname + window.location.search) {
      router.replace(newUrl, { scroll: false });
    }
  }, [search, statusFilter, dateFrom, dateTo, page, router]);

  const columns: Column<Row>[] = [
    {
      key: "company",
      header: "Companie",
      sortable: true,
      render: (r) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {r.company}
        </div>
      ),
    },
    {
      key: "cui",
      header: "CUI",
      render: (r) => (
        <div className="text-slate-600 dark:text-slate-400">
          {r.cui || '-'}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (r) => (
        <div className="text-slate-600 dark:text-slate-400">
          {r.email}
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
      key: "createdAt",
      header: "Creat",
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
          href={`/admin/seller-applications/${r.id}/${slugifyCompany(r.company)}`}
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
                placeholder="Caută după companie, CUI sau email..."
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
                <SelectItem value="received">Primită</SelectItem>
                <SelectItem value="in_review">În review</SelectItem>
                <SelectItem value="need_info">Necesită informații</SelectItem>
                <SelectItem value="approved">Aprobată</SelectItem>
                <SelectItem value="rejected">Respinsă</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchApplications}
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
          <p className="text-base">Se încarcă aplicațiile...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl">
          <p className="text-base">Nu s-au găsit aplicații.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                ariaLabel="Paginare aplicații vânzători"
              />
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-slate-500 text-center pt-2">
            Afișate {rows.length} din {totalItems} aplicații
          </div>
        </div>
      )}
    </div>
  );
}
