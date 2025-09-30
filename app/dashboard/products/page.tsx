"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, Edit, Eye, EyeOff, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/hooks/use-toast";
import type { SellerProductListItem, SellerProductsResponse } from "@/lib/types";

// Mock data for demonstration
const mockProducts: SellerProductListItem[] = [
  {
    id: 1,
    title: "Vază ceramică — Natur",
    price: 129.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    status: "active",
    stockQty: 12,
    categorySlug: "vaze",
    updatedAt: "2024-12-15T14:30:00Z"
  },
  {
    id: 2,
    title: "Ghiveci ceramică alb",
    price: 89.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    status: "draft",
    stockQty: 8,
    categorySlug: "ghivece",
    updatedAt: "2024-12-14T16:45:00Z"
  },
  {
    id: 3,
    title: "Set 3 ghivece mici",
    price: 45.0,
    currency: "RON",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    status: "unpublished",
    stockQty: 0,
    categorySlug: "ghivece",
    updatedAt: "2024-12-12T13:20:00Z"
  },
  {
    id: 4,
    title: "Vază sticlă transparentă",
    price: 75.0,
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    status: "active",
    stockQty: 5,
    categorySlug: "vaze",
    updatedAt: "2024-12-15T10:15:00Z"
  }
];

const statusOptions = [
  { value: "all", label: "Toate" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "unpublished", label: "Nepublicate" }
];

const stockOptions = [
  { value: "all", label: "Toate" },
  { value: "yes", label: "În stoc" },
  { value: "no", label: "Fără stoc" }
];

const sortOptions = [
  { value: "updated_desc", label: "Ultima modificare" },
  { value: "created_desc", label: "Cele mai noi" },
  { value: "price_asc", label: "Preț crescător" },
  { value: "price_desc", label: "Preț descrescător" }
];

const pageSizeOptions = [
  { value: "10", label: "10 pe pagină" },
  { value: "25", label: "25 pe pagină" },
  { value: "50", label: "50 pe pagină" }
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [products, setProducts] = useState<SellerProductListItem[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // URL params
  const status = searchParams.get("status") || "all";
  const inStock = searchParams.get("inStock") || "all";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "updated_desc";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter(p => p.status === status);
    }

    // Stock filter
    if (inStock === "yes") {
      filtered = filtered.filter(p => p.stockQty > 0);
    } else if (inStock === "no") {
      filtered = filtered.filter(p => p.stockQty === 0);
    }

    // Search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    switch (sort) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "created_desc":
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "updated_desc":
      default:
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    return filtered;
  }, [products, status, inStock, q, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Update URL params
  const updateParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1"); // Reset to first page when filtering
    router.push(`/dashboard/products?${params.toString()}`);
  };

  // Actions
  const handlePublish = async (id: number) => {
    setLoading(true);
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: "active" as const } : p
      ));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast("Produsul a fost publicat cu succes.", "success");
    } catch (error) {
      // Revert on error
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: "draft" as const } : p
      ));
      toast("Nu s-a putut publica produsul.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (id: number) => {
    setLoading(true);
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: "unpublished" as const } : p
      ));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast("Produsul a fost nepublicat cu succes.", "success");
    } catch (error) {
      // Revert on error
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: "active" as const } : p
      ));
      toast("Nu s-a putut nepublica produsul.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      // Optimistic update
      setProducts(prev => prev.filter(p => p.id !== id));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast("Produsul a fost șters cu succes.", "success");
    } catch (error) {
      // Revert on error
      setProducts(prev => [...prev, mockProducts.find(p => p.id === id)!]);
      toast("Nu s-a putut șterge produsul.", "error");
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "success",
      draft: "secondary",
      unpublished: "destructive"
    } as const;

    const labels = {
      active: "Activ",
      draft: "Draft",
      unpublished: "Nepublicat"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Produsele mele
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Gestionează produsele tale din magazin
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă produs
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Caută
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Caută produse..."
                value={q}
                onChange={(e) => updateParams({ q: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <Select
              value={status}
              onValueChange={(value) => updateParams({ status: value })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stoc
            </label>
            <Select
              value={inStock}
              onValueChange={(value) => updateParams({ inStock: value })}
            >
              {stockOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sortează
            </label>
            <Select
              value={sort}
              onValueChange={(value) => updateParams({ sort: value })}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pe pagină
            </label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => updateParams({ pageSize: value })}
            >
              {pageSizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Se încarcă...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Nu ai produse
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Începe să adaugi produse în magazinul tău.
            </p>
            <Link href="/dashboard/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adaugă primul produs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Produs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Preț
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Stoc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Actualizat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <Image
                            src={product.image}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-brand"
                          >
                            {product.title}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {product.price} {product.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {product.stockQty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {product.categorySlug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        {product.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(product.id)}
                            disabled={loading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {product.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(product.id)}
                            disabled={loading}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(product.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Afișând {startIndex + 1}-{Math.min(startIndex + pageSize, filteredProducts.length)} din {filteredProducts.length} produse
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: (page - 1).toString() })}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Pagina {page} din {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: (page + 1).toString() })}
                  disabled={page === totalPages}
                >
                  Următorul
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Șterge produs"
        description="Ești sigur că vrei să ștergi acest produs? Această acțiune nu poate fi anulată."
        confirmText="Șterge"
        cancelText="Anulează"
        onConfirm={() => deleteConfirm ? handleDelete(deleteConfirm) : undefined}
        variant="danger"
      />
    </div>
  );
}
