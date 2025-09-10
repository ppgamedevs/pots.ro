"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Eye, Trash2, MoreHorizontal } from "lucide-react";

type Row = {
  id: number;
  title: string;
  price: number;
  currency: string;
  stock: number;
  status: string;
  views: number;
  sales: number;
  created_at: string;
  updated_at: string;
};

export default function SellerProductsClient({ 
  initial 
}: { 
  initial: { items: Row[]; meta: { totalPages: number; page: number; totalItems: number } } 
}) {
  const [rows, setRows] = useState<Row[]>(initial.items);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const columns: Column<Row>[] = [
    { 
      key: "title", 
      header: "Produs", 
      sortable: true, 
      render: (r) => (
        <div className="max-w-[300px]">
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {r.title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ID: {r.id}
          </div>
        </div>
      )
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
      )
    },
    { 
      key: "stock", 
      header: "Stoc", 
      align: "right", 
      sortable: true,
      render: (r) => (
        <div className="text-right">
          <span className={r.stock > 10 ? "text-green-600" : r.stock > 0 ? "text-amber-600" : "text-red-600"}>
            {r.stock}
          </span>
          {r.stock === 0 && (
            <div className="text-xs text-red-500">Stoc epuizat</div>
          )}
        </div>
      )
    },
    { 
      key: "status", 
      header: "Status", 
      sortable: true, 
      render: (r) => (
        <Badge 
          variant={r.status === "active" ? "success" : r.status === "pending" ? "warning" : "neutral"}
        >
          {r.status}
        </Badge>
      )
    },
    { 
      key: "views", 
      header: "Vizualizări", 
      align: "right", 
      sortable: true,
      render: (r) => r.views.toLocaleString()
    },
    { 
      key: "sales", 
      header: "Vânzări", 
      align: "right", 
      sortable: true,
      render: (r) => (
        <span className="font-medium text-green-600">
          {r.sales}
        </span>
      )
    },
    { 
      key: "created_at", 
      header: "Creat", 
      sortable: true, 
      render: (r) => new Date(r.created_at).toLocaleDateString("ro-RO")
    },
    {
      key: "actions",
      header: "Acțiuni",
      align: "center",
      width: "140px",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" title="Vizualizează">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Editează">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Șterge">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    },
  ];

  const handleSelectionChange = (keys: (string | number)[]) => {
    setSelectedRows(keys);
    console.log("Selected products:", keys);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Caută produse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="">Toate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă produs
        </Button>
      </div>

      {/* Selection Actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-brand/10 rounded-lg">
          <span className="text-sm text-brand font-medium">
            {selectedRows.length} produse selectate
          </span>
          <Button variant="secondary" size="sm">
            Activează
          </Button>
          <Button variant="secondary" size="sm">
            Dezactivează
          </Button>
          <Button variant="destructive" size="sm">
            Șterge
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {rows.length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Total produse
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div className="text-2xl font-bold text-green-600">
            {rows.filter(r => r.status === "active").length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Active
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div className="text-2xl font-bold text-amber-600">
            {rows.filter(r => r.stock === 0).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Stoc epuizat
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div className="text-2xl font-bold text-blue-600">
            {rows.reduce((sum, r) => sum + r.sales, 0)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Vânzări totale
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        selectable
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
