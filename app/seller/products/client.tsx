"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RowActions } from "@/components/ui/row-actions";
import { useConfirm } from "@/components/ui/use-confirm";
import { toast } from "sonner";
import { Search, Plus, Edit, Eye, Trash2, MoreHorizontal } from "lucide-react";
import { CsvImportDialog } from "@/components/seller/CsvImportDialog";

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
  const confirm = useConfirm();

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
      header: "",
      align: "right",
      width: "60px",
      render: (r) => (
        <RowActions
          published={r.status === "active"}
          onEdit={() => console.log("Edit product", r.id)}
          onPublish={async () => {
            const ok = await confirm({
              title: "Publish product?",
              description: "Produsul va deveni vizibil public.",
              confirmText: "Publish",
            });
            if (!ok) return;
            try {
              // await fetch(`/api/seller/products/${r.id}/publish`, { method: "POST" });
              console.log("Publishing product", r.id);
              toast.success("Produs publicat");
              // mutate(); // re-fetch list
            } catch (error) {
              toast.error("Eroare la publicare");
            }
          }}
          onUnpublish={async () => {
            const ok = await confirm({
              title: "Unpublish product?",
              description: "Produsul nu va mai fi vizibil public.",
              confirmText: "Unpublish",
            });
            if (!ok) return;
            try {
              // await fetch(`/api/seller/products/${r.id}/unpublish`, { method: "POST" });
              console.log("Unpublishing product", r.id);
              toast.success("Produs ascuns");
              // mutate();
            } catch (error) {
              toast.error("Eroare la ascundere");
            }
          }}
          onDelete={async () => {
            const ok = await confirm({
              title: "Delete product?",
              description: "Acțiune ireversibilă. Produsul va fi șters definitiv.",
              confirmText: "Delete",
              variant: "danger",
            });
            if (!ok) return;
            try {
              // await fetch(`/api/seller/products/${r.id}`, { method: "DELETE" });
              console.log("Deleting product", r.id);
              toast.success("Produs șters");
              // mutate();
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
              <SelectItem value="all">Toate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <CsvImportDialog 
            onImportComplete={(result) => {
              toast.success(`Import completat: ${result.successCount} produse importate`);
              // Refresh the page or refetch data
              window.location.reload();
            }}
          />
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă produs
          </Button>
        </div>
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
        rowKey={(r: Row) => r.id}
        selectable
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
