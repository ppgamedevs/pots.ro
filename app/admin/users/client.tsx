"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin" | "support";
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    buyer: "Cumpărător",
    seller: "Vânzător",
    admin: "Admin",
    support: "Support",
  };
  return labels[role] || role;
}

function getRoleVariant(role: string): "success" | "warning" | "danger" | "neutral" | "brand" {
  if (role === "admin") return "danger";
  if (role === "support") return "brand";
  if (role === "seller") return "warning";
  return "neutral";
}

export default function AdminUsersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (search) params.set("q", search);
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setRows(data.items || []);
      setTotalItems(data.meta?.totalItems || 0);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Eroare la încărcarea utilizatorilor");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
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
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (page > 1) params.set("page", page.toString());

    const newUrl = `/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
    // Only update URL if it's different to avoid unnecessary navigation
    if (newUrl !== window.location.pathname + window.location.search) {
      router.replace(newUrl, { scroll: false });
    }
  }, [search, roleFilter, statusFilter, page, router]);

  const columns: Column<Row>[] = [
    {
      key: "email",
      header: "Email",
      align: "left",
      sortable: true,
      render: (r) => (
        <div>
          <Link
            href={`/admin/users/${r.id}`}
            className="font-medium hover:underline text-slate-900 dark:text-slate-100"
          >
            {r.email}
          </Link>
        </div>
      ),
    },
    {
      key: "name",
      header: "Nume",
      align: "left",
      sortable: true,
      render: (r) => (
        <div className="text-slate-700 dark:text-slate-300">
          {r.name || "-"}
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      align: "left",
      sortable: true,
      render: (r) => (
        <Badge variant={getRoleVariant(r.role)}>
          {getRoleLabel(r.role)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      sortable: false,
      render: (r) => (
        <Badge variant={r.status === "suspended" ? "danger" : "success"}>
          {r.status === "suspended" ? "Suspendat" : "Activ"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Creat",
      align: "left",
      sortable: true,
      render: (r) => new Date(r.created_at).toLocaleDateString("ro-RO"),
    },
    {
      key: "last_login",
      header: "Last Login",
      align: "left",
      sortable: false,
      render: (r) => (
        <div className="text-slate-700 dark:text-slate-300">
          {r.last_login ? new Date(r.last_login).toLocaleDateString("ro-RO") : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "60px",
      render: (r) => (
        <Link href={`/admin/users/${r.id}`}>
          <Button variant="ghost" size="sm">
            Detalii
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Căutare
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Caută după email sau nume..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Rol
          </label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toate rolurile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate rolurile</SelectItem>
              <SelectItem value="buyer">Cumpărător</SelectItem>
              <SelectItem value="seller">Vânzător</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toate statusurile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="active">Activ</SelectItem>
              <SelectItem value="suspended">Suspendat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            Se încarcă...
          </div>
        ) : (
          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            ariaLabel="Paginare utilizatori"
          />
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
        Afișând {rows.length} din {totalItems} utilizatori
      </div>
    </div>
  );
}
