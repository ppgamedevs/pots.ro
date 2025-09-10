"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MoreHorizontal } from "lucide-react";

type Row = {
  id: number;
  title: string;
  price: number;
  currency: string;
  stock: number;
  status: string;
  sellers: { slug: string; brand_name: string };
  created_at: string;
  updated_at: string;
};

export default function AdminProductsClient({ 
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
        <div className="max-w-[340px]">
          <Link 
            href={`/p/${r.id}`} 
            className="font-medium hover:underline text-slate-900 dark:text-slate-100"
          >
            {r.title}
          </Link>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Vândut de{" "}
            <Link 
              className="hover:underline text-brand" 
              href={`/s/${r.sellers.slug}`}
            >
              {r.sellers.brand_name}
            </Link>
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
        <span className={r.stock > 10 ? "text-green-600" : r.stock > 0 ? "text-amber-600" : "text-red-600"}>
          {r.stock}
        </span>
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
      key: "created_at", 
      header: "Creat", 
      sortable: true, 
      render: (r) => new Date(r.created_at).toLocaleDateString("ro-RO")
    },
    {
      key: "actions",
      header: "Acțiuni",
      align: "center",
      width: "120px",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const handleSelectionChange = (keys: (string | number)[]) => {
    setSelectedRows(keys);
    console.log("Selected rows:", keys);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Caută produse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="">Toate</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrează
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
