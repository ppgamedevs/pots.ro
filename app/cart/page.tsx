"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useToast } from "@/lib/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { mutate } from "swr";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import type { Cart, CartItem } from "@/lib/types";

export default function CartPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { data: cart, error, isLoading } = useSWR<Cart>('/api/cart', (url: string) =>
    fetch(url).then(res => res.json())
  );

  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1 || newQty > 99) return;

    setLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qty: newQty }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // Refresh cart data
      mutate('/api/cart');

      toast("Cantitate actualizată", "success");
    } catch (error) {
      toast("Nu s-a putut actualiza cantitatea.", "error");
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeItem = async (productId: string) => {
    setLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Refresh cart data
      mutate('/api/cart');

      toast("Produs eliminat din coș", "success");
    } catch (error) {
      toast("Nu s-a putut elimina produsul.", "error");
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
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src="/placeholder.png"
                            alt={item.productName}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Preț unitar: {formatPrice(item.unitPrice, 'RON')}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Total: {formatPrice(item.unitPrice * item.qty, 'RON')}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.qty - 1)}
                            disabled={loading[item.productId] || item.qty <= 1}
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
                        {formatPrice(cart.items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0), 'RON')}
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
                          {formatPrice(cart.items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0), 'RON')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout" className="w-full">
                    <Button size="lg" className="w-full mb-4">
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Continuă la checkout
                    </Button>
                  </Link>

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