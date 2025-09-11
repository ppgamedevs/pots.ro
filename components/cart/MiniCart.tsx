"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { mutate } from "swr";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import type { Cart, CartItem } from "@/lib/types";

interface MiniCartProps {
  className?: string;
}

export default function MiniCart({ className = "" }: MiniCartProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { data: cart, error, isLoading } = useSWR<Cart>('/api/cart', (url) =>
    fetch(url).then(res => res.json())
  );

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close popover on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.qty, 0) || 0;

  const updateQuantity = async (productId: number, newQty: number) => {
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

      toast({
        title: "Cantitate actualizată",
        description: "Cantitatea produsului a fost actualizată.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza cantitatea.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeItem = async (productId: number) => {
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

      toast({
        title: "Produs eliminat",
        description: "Produsul a fost eliminat din coș.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut elimina produsul.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className="relative"
          aria-label="Coș de cumpărături (eroare)"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">Coș de cumpărături</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Coș de cumpărături (${itemCount} produse)`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
        <span className="sr-only">Coș de cumpărături</span>
      </Button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Coș de cumpărături"
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Coșul tău ({itemCount} {itemCount === 1 ? 'produs' : 'produse'})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
              aria-label="Închide coșul"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                Se încarcă...
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Coșul tău este gol
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  Continuă cumpărăturile
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.qty - 1)}
                        disabled={loading[item.productId] || item.qty <= 1}
                        className="h-6 w-6 p-0"
                        aria-label="Scade cantitatea"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-medium w-6 text-center">
                        {item.qty}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.qty + 1)}
                        disabled={loading[item.productId] || item.qty >= 99}
                        className="h-6 w-6 p-0"
                        aria-label="Crește cantitatea"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      disabled={loading[item.productId]}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      aria-label="Elimină produsul"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Subtotal:
                </span>
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {formatPrice(cart.subtotal, cart.currency)}
                </span>
              </div>
              
              <Link href="/cart" onClick={() => setIsOpen(false)}>
                <Button className="w-full">
                  Vezi coșul
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
