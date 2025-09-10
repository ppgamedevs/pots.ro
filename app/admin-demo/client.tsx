"use client";
import { DataTable, type Column } from "@/components/ui/datatable";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UITabs } from "@/components/ui/tabs";
import { Code, Database, Table, Settings } from "lucide-react";

type ProductRow = {
  id: number;
  title: string;
  price: number;
  currency: string;
  stock: number;
  status: string;
  category: string;
  created_at: string;
};

type OrderRow = {
  id: number;
  customer: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function AdminDemoClient() {
  const [selectedProducts, setSelectedProducts] = useState<(string | number)[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<(string | number)[]>([]);

  // Mock data
  const products: ProductRow[] = [
    {
      id: 1,
      title: "Ghiveci ceramic alb",
      price: 49.9,
      currency: "RON",
      stock: 15,
      status: "active",
      category: "ghivece",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      title: "Vază ceramic înaltă",
      price: 65.0,
      currency: "RON",
      stock: 8,
      status: "active",
      category: "vaze",
      created_at: "2024-01-10T09:15:00Z",
    },
    {
      id: 3,
      title: "Cutie decorativă",
      price: 25.0,
      currency: "RON",
      stock: 0,
      status: "inactive",
      category: "cutii",
      created_at: "2024-01-05T16:45:00Z",
    },
  ];

  const orders: OrderRow[] = [
    {
      id: 1001,
      customer: "Maria Ionescu",
      amount: 89.9,
      currency: "RON",
      status: "completed",
      created_at: "2024-01-20T14:30:00Z",
    },
    {
      id: 1002,
      customer: "Alexandru Pop",
      amount: 125.0,
      currency: "RON",
      status: "pending",
      created_at: "2024-01-19T11:15:00Z",
    },
    {
      id: 1003,
      customer: "Elena Dumitrescu",
      amount: 45.0,
      currency: "RON",
      status: "shipped",
      created_at: "2024-01-18T16:45:00Z",
    },
  ];

  const productColumns: Column<ProductRow>[] = [
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
            {r.category}
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
          variant={r.status === "active" ? "success" : "neutral"}
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
  ];

  const orderColumns: Column<OrderRow>[] = [
    { 
      key: "id", 
      header: "ID", 
      sortable: true,
      render: (r) => `#${r.id}`
    },
    { 
      key: "customer", 
      header: "Client", 
      sortable: true,
      render: (r) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {r.customer}
        </div>
      )
    },
    { 
      key: "amount", 
      header: "Sumă", 
      align: "right", 
      sortable: true, 
      render: (r) => (
        <span className="font-medium">
          {r.amount.toFixed(2)} {r.currency}
        </span>
      )
    },
    { 
      key: "status", 
      header: "Status", 
      sortable: true, 
      render: (r) => (
        <Badge 
          variant={
            r.status === "completed" ? "success" : 
            r.status === "pending" ? "warning" : 
            r.status === "shipped" ? "brand" : "neutral"
          }
        >
          {r.status}
        </Badge>
      )
    },
    { 
      key: "created_at", 
      header: "Data", 
      sortable: true, 
      render: (r) => new Date(r.created_at).toLocaleDateString("ro-RO")
    },
  ];

  return (
    <div className="space-y-6">
      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-brand" />
              Supabase Adapter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Paginare cu count: 'exact'</li>
              <li>• Filtre și sortare</li>
              <li>• Range queries</li>
              <li>• RPC support</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table className="h-5 w-5 text-brand" />
              DataTable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Sortare client-side</li>
              <li>• Selectare rânduri</li>
              <li>• Sticky header</li>
              <li>• Responsive design</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-brand" />
              Admin Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Type-safe</li>
              <li>• Dark mode</li>
              <li>• Accessibility</li>
              <li>• Reusable</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demo */}
      <UITabs
        defaultValue="products"
        tabs={[
          {
            value: "products",
            label: `Produse (${products.length})`,
            content: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Gestionare Produse</h3>
                  {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand font-medium">
                        {selectedProducts.length} selectate
                      </span>
                      <Button variant="secondary" size="sm">
                        Activează
                      </Button>
                      <Button variant="destructive" size="sm">
                        Șterge
                      </Button>
                    </div>
                  )}
                </div>
                <DataTable
                  columns={productColumns}
                  rows={products}
                  rowKey={(r) => r.id}
                  selectable
                  onSelectionChange={setSelectedProducts}
                />
              </div>
            )
          },
          {
            value: "orders",
            label: `Comenzi (${orders.length})`,
            content: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Gestionare Comenzi</h3>
                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand font-medium">
                        {selectedOrders.length} selectate
                      </span>
                      <Button variant="secondary" size="sm">
                        Procesează
                      </Button>
                      <Button variant="destructive" size="sm">
                        Anulează
                      </Button>
                    </div>
                  )}
                </div>
                <DataTable
                  columns={orderColumns}
                  rows={orders}
                  rowKey={(r) => r.id}
                  selectable
                  onSelectionChange={setSelectedOrders}
                />
              </div>
            )
          }
        ]}
      />

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Exemplu de utilizare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-x-auto">
{`// Supabase Adapter
const { items, meta } = await supaPaginate(
  supabase, "products", { page, pageSize },
  q => q.eq("status", "active"),
  { column: "created_at", ascending: false },
  "*, sellers(*)"
);

// DataTable
<DataTable
  columns={columns}
  rows={items}
  rowKey={(r) => r.id}
  selectable
  onSelectionChange={handleSelection}
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
