"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RowActions } from "@/components/ui/row-actions";
import { useConfirm } from "@/components/ui/use-confirm";
import { toast } from "sonner";
import { Search, RefreshCw, X } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Combobox } from "@/components/ui/combobox";

type Row = {
  id: string;
  title: string;
  price: number;
  currency: string;
  stock: number;
  status: string;
  sellers: { slug: string; brand_name: string };
  created_at: string;
  updated_at: string;
};

export default function AdminProductsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  // Get initial values from URL
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [companyFilters, setCompanyFilters] = useState<string[]>(() => {
    const companiesParam = searchParams.get("companies");
    return companiesParam ? JSON.parse(companiesParam) : [];
  });
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || "all");
  const [stockRange, setStockRange] = useState(searchParams.get("stockRange") || "all");
  const [companies, setCompanies] = useState<{ id: string; slug: string; brand_name: string }[]>([]);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  // Fetch companies
  const fetchCompanies = async (q: string = "") => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/sellers?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (search) params.set("q", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (companyFilters.length > 0) {
        params.set("companies", JSON.stringify(companyFilters));
      }
      if (priceRange && priceRange !== "all") params.set("priceRange", priceRange);
      if (stockRange && stockRange !== "all") params.set("stockRange", stockRange);

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setRows(data.items || []);
      setTotalItems(data.meta?.totalItems || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Eroare la încărcarea produselor");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, companyFilters, priceRange, stockRange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchProducts();
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
    if (companyFilters.length > 0) {
      params.set("companies", JSON.stringify(companyFilters));
    }
    if (priceRange && priceRange !== "all") params.set("priceRange", priceRange);
    if (stockRange && stockRange !== "all") params.set("stockRange", stockRange);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `/admin/products${params.toString() ? `?${params.toString()}` : ""}`;
    // Only update URL if it's different to avoid unnecessary navigation
    if (newUrl !== window.location.pathname + window.location.search) {
      router.replace(newUrl, { scroll: false });
    }
  }, [search, statusFilter, companyFilters, priceRange, stockRange, page, router]);


  const columns: Column<Row>[] = [
    {
      key: "sellers",
      header: "Companie",
      sortable: false,
      render: (r) => (
        <div>
          <Link
            href={`/s/${r.sellers.slug}`}
            className="font-medium hover:underline text-slate-900 dark:text-slate-100"
            target="_blank"
          >
            {r.sellers.brand_name}
          </Link>
        </div>
      ),
    },
    {
      key: "title",
      header: "Produs",
      sortable: true,
      render: (r) => (
        <div className="max-w-[340px]">
          <Link
            href={`/p/${r.id}`}
            className="font-medium hover:underline text-slate-900 dark:text-slate-100"
            target="_blank"
          >
            {r.title}
          </Link>
        </div>
      ),
    },
    {
      key: "price",
      header: "Preț",
      align: "right",
      sortable: true,
      render: (r) => (
        <span className="font-medium">
          {r.price.toFixed(2)} {r.currency}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stoc",
      align: "right",
      sortable: true,
      render: (r) => (
        <span
          className={
            r.stock > 10
              ? "text-green-600 dark:text-green-400"
              : r.stock > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {r.stock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <Badge
          variant={
            r.status === "active"
              ? "success"
              : r.status === "draft"
              ? "warning"
              : "neutral"
          }
        >
          {r.status === "active"
            ? "Active"
            : r.status === "draft"
            ? "Draft"
            : "Arhivat"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Creat",
      sortable: true,
      render: (r) => new Date(r.created_at).toLocaleDateString("ro-RO"),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "60px",
      render: (r) => (
        <RowActions
          published={r.status === "active"}
          onEdit={() => {
            router.push(`/admin/products/${r.id}`);
          }}
          onPublish={async () => {
            const ok = await confirm({
              title: "Publică produs?",
              description: "Produsul va deveni vizibil public.",
              confirmText: "Publică",
            });
            if (!ok) return;
            try {
              const res = await fetch(`/api/admin/products/${r.id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "active" }),
                credentials: "include",
              });
              if (!res.ok) throw new Error();
              toast.success("Produs publicat");
              fetchProducts();
            } catch (error) {
              toast.error("Eroare la publicare");
            }
          }}
          onUnpublish={async () => {
            const ok = await confirm({
              title: "Ascunde produs?",
              description: "Produsul nu va mai fi vizibil public.",
              confirmText: "Ascunde",
            });
            if (!ok) return;
            try {
              const res = await fetch(`/api/admin/products/${r.id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "draft" }),
                credentials: "include",
              });
              if (!res.ok) throw new Error();
              toast.success("Produs ascuns");
              fetchProducts();
            } catch (error) {
              toast.error("Eroare la ascundere");
            }
          }}
          onDelete={async () => {
            const ok = await confirm({
              title: "Șterge produs?",
              description: "Acțiune ireversibilă. Produsul va fi șters definitiv.",
              confirmText: "Șterge",
              variant: "danger",
            });
            if (!ok) return;
            try {
              const res = await fetch(`/api/admin/products/${r.id}`, {
                method: "DELETE",
                credentials: "include",
              });
              if (!res.ok) throw new Error();
              toast.success("Produs șters");
              fetchProducts();
            } catch (error) {
              toast.error("Eroare la ștergere");
            }
          }}
        />
      ),
    },
  ];

  const handleSelectionChange = (keys: (string | number)[]) => {
    setSelectedRows(keys);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePriceRangeChange = (value: string) => {
    setPriceRange(value);
    setPage(1);
  };

  const handleStockRangeChange = (value: string) => {
    setStockRange(value);
    setPage(1);
  };

  const runBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    const ids = selectedRows.map(String);
    if (ids.length === 0) return;

    const labels: Record<typeof action, string> = {
      activate: "Activează",
      deactivate: "Dezactivează",
      delete: "Șterge",
    };

    const ok = await confirm({
      title: `${labels[action]} produse?`,
      description:
        action === "delete"
          ? "Acțiune ireversibilă. Produsele selectate vor fi șterse definitiv."
          : "Se va actualiza statusul produselor selectate.",
      confirmText: labels[action],
      variant: action === "delete" ? "danger" : undefined,
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error();

      toast.success(
        action === "delete"
          ? "Produsele au fost șterse"
          : "Produsele au fost actualizate"
      );
      setSelectedRows([]);
      fetchProducts();
    } catch (error) {
      toast.error(
        action === "delete"
          ? "Eroare la ștergere"
          : "Eroare la actualizare"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Caută produse după nume..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Arhivate</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchProducts}
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

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Filter */}
          <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Companie
            </label>
            <Combobox
              value=""
              onValueChange={(value: string) => {
                if (value && !companyFilters.includes(value)) {
                  setCompanyFilters([...companyFilters, value]);
                  setPage(1);
                }
              }}
              options={companies
                .filter(c => !companyFilters.includes(c.brand_name))
                .map(c => ({ value: c.brand_name, label: c.brand_name }))}
              placeholder="Caută și adaugă..."
              emptyText="Nu s-au găsit companii."
            />
            {companyFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {companyFilters.map((company) => (
                  <Badge
                    key={company}
                    variant="secondary"
                    className="px-2 py-0.5 text-xs"
                  >
                    {company}
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyFilters(companyFilters.filter(c => c !== company));
                        setPage(1);
                      }}
                      className="ml-1.5 hover:text-red-600 transition-colors"
                      aria-label={`Șterge ${company}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter */}
          <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Preț (RON)
            </label>
            <Select value={priceRange} onValueChange={handlePriceRangeChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Toate prețurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate prețurile</SelectItem>
                <SelectItem value="0-50">0 - 50 RON</SelectItem>
                <SelectItem value="50-100">50 - 100 RON</SelectItem>
                <SelectItem value="100-200">100 - 200 RON</SelectItem>
                <SelectItem value="200-500">200 - 500 RON</SelectItem>
                <SelectItem value="500+">Peste 500 RON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Filter */}
          <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Stoc
            </label>
            <Select value={stockRange} onValueChange={handleStockRangeChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Toate stocurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate stocurile</SelectItem>
                <SelectItem value="0-5">0 - 5</SelectItem>
                <SelectItem value="6-10">6 - 10</SelectItem>
                <SelectItem value="11-20">11 - 20</SelectItem>
                <SelectItem value="30+">Peste 30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-brand/10 border border-brand/20 rounded-xl">
          <span className="text-sm text-brand font-medium">
            {selectedRows.length} produse selectate
          </span>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={() => runBulkAction("activate")}>
              Activează
            </Button>
            <Button variant="secondary" size="sm" onClick={() => runBulkAction("deactivate")}>
              Dezactivează
            </Button>
            <Button variant="destructive" size="sm" onClick={() => runBulkAction("delete")}>
              Șterge
            </Button>
          </div>
        </div>
      )}

      {/* DataTable */}
      {loading && rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-base">Se încarcă produsele...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl">
          <p className="text-base">Nu s-au găsit produse.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r: Row) => r.id}
              selectable
              onSelectionChange={handleSelectionChange}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                ariaLabel="Paginare produse admin"
              />
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-slate-500 text-center pt-2">
            Afișate {rows.length} din {totalItems} produse
          </div>
        </div>
      )}
    </div>
  );
}
