"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useToast } from "@/lib/hooks/use-toast";
import { useUser } from "@/lib/hooks/useUser";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import Link from "next/link";
import Image from "next/image";
import type { Cart, CartItem } from "@/lib/types";

export default function CartPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetcher = (url: string) => fetch(url, { 
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  }).then(res => res.json());
  
  const { data: cart, error, isLoading, mutate: mutateCart } = useSWR<Cart>('/api/cart', fetcher);

  const emptyCart: Cart = {
    id: "",
    items: [],
    totals: { subtotal: 0, shipping: 0, tax: 0, total: 0, currency: "RON" },
    createdAt: "",
    updatedAt: "",
  };

  const recomputeTotals = (items: CartItem[], prevTotals: Cart["totals"]): Cart["totals"] => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal ?? item.unitPrice * item.qty), 0);
    const shipping = prevTotals?.shipping ?? 0;
    const tax = prevTotals?.tax ?? 0;
    return {
      ...prevTotals,
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
      currency: prevTotals?.currency || "RON",
    };
  };

  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1 || newQty > 99) return;
    if (!cart) return;

    // Optimistic update - update UI immediately
    const prevCart = cart;
    const optimisticItems = cart.items.map((it) =>
      it.productId === productId
        ? { ...it, qty: newQty, subtotal: it.unitPrice * newQty }
        : it
    );
    const optimisticCart: Cart = {
      ...cart,
      items: optimisticItems,
      totals: recomputeTotals(optimisticItems, cart.totals),
    };
    
    // Update local state immediately
    mutateCart(optimisticCart, false);
    setLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ qty: newQty }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Update quantity error:", errorData);
        // Rollback on error
        mutateCart(prevCart, false);
        throw new Error(errorData.error || "Failed to update quantity");
      }

      // Fetch fresh data and update ALL subscribers globally
      const freshCart = await fetcher("/api/cart");
      await globalMutate("/api/cart", freshCart, false);

      toast("Cantitate actualizată", "success");
    } catch (error) {
      console.error('Update quantity exception:', error);
      const errorMessage = error instanceof Error ? error.message : "Nu s-a putut actualiza cantitatea.";
      toast(errorMessage, "error");
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeItem = async (productId: string) => {
    if (!cart) return;
    
    // Optimistic update - remove from UI immediately
    const prevCart = cart;
    const optimisticItems = cart.items.filter((it) => it.productId !== productId);
    const optimisticCart: Cart = {
      ...cart,
      items: optimisticItems,
      totals: recomputeTotals(optimisticItems, cart.totals),
    };
    
    // Update local state immediately
    mutateCart(optimisticCart, false);
    setLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Remove item error:", errorData);
        // Rollback on error
        mutateCart(prevCart, false);
        throw new Error(errorData.error || "Failed to remove item");
      }

      // Fetch fresh data and update ALL subscribers globally
      const freshCart = await fetcher("/api/cart");
      await globalMutate("/api/cart", freshCart, false);

      toast("Produs eliminat din coș", "success");
    } catch (error) {
      console.error('Remove item exception:', error);
      const errorMessage = error instanceof Error ? error.message : "Nu s-a putut elimina produsul.";
      toast(errorMessage, "error");
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price: number, currency: string = 'RON') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const breadcrumbItems = [
    { name: "Acasă", href: "/" },
    { name: "Coș de cumpărături", href: "/cart" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Eroare la încărcarea coșului
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Nu s-a putut încărca coșul de cumpărături. Vă rugăm să încercați din nou.
            </p>
            <Button onClick={() => window.location.reload()}>
              Încearcă din nou
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            Coșul tău de cumpărături
          </h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">Se încarcă coșul...</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-24 w-24 mx-auto text-slate-300 dark:text-slate-600 mb-6" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Coșul tău este gol
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8">
                Adaugă produse în coș pentru a începe cumpărăturile.
              </p>
              <Link href="/">
                <Button size="lg">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Continuă cumpărăturile
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Produse în coș ({cart.items.length})
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {cart.items.map((item) => (
                      <div
                        key={item.productId}
                        className="p-6 flex items-center gap-4"
                      >
                        {/* Product Image */}
                        <Link href={`/p/${item.productId}-${item.slug || ''}`}>
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={item.imageUrl || '/placeholder.png'}
                              alt={item.productName}
                              fill
                              className="object-cover rounded-lg"
                              sizes="80px"
                            />
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/p/${item.productId}-${item.slug || ''}`}>
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 hover:text-primary transition-micro">
                              {item.productName}
                            </h3>
                          </Link>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Preț unitar: {formatPrice(item.unitPrice, cart.totals.currency || 'RON')}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Total: {formatPrice(item.subtotal || (item.unitPrice * item.qty), cart.totals.currency || 'RON')}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.qty - 1)}
                            disabled={loading[item.productId] || item.qty <= 1}
                            aria-label="Scade cantitatea"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.qty}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.qty + 1)}
                            disabled={loading[item.productId] || item.qty >= 99}
                            aria-label="Crește cantitatea"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          disabled={loading[item.productId]}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Elimină din coș"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Rezumat comandă
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Subtotal ({cart.items.length} produse)
                      </span>
                      <span className="font-medium">
                        {formatPrice(cart.totals.subtotal, cart.totals.currency || 'RON')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Livrare</span>
                      <span className="font-medium text-green-600">Gratuită</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-brand">
                          {formatPrice(cart.totals.total, cart.totals.currency || 'RON')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full mb-4"
                    onClick={() => {
                      if (!isAuthenticated) {
                        // Redirect to login with return URL
                        router.push(`/autentificare?next=${encodeURIComponent('/finalizare')}`);
                      } else {
                        // User is authenticated, proceed to checkout
                        router.push('/finalizare');
                      }
                    }}
                    disabled={userLoading}
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Continuă la checkout
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Funcționalitatea de plată va fi implementată în versiunea finală.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}