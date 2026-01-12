"use client";

import { useEffect } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import type { Cart } from "@/lib/types";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  // Fetch cart data - disable auto-revalidation to avoid overwriting changes
  const { data: cart, error, isLoading } = useSWR<Cart>('/api/cart', (url: string) =>
    fetch(url, { credentials: 'include', cache: 'no-store' }).then(res => res.json()),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  );

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cartItems = cart?.items || [];
  const total = cart?.totals?.total || 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Mini Cart */}
      <div className="fixed top-16 right-4 w-80 bg-bg border border-line rounded-lg shadow-elev z-50">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Coșul tău</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-1"
              aria-label="Închide coșul de cumpărături"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Cart Items */}
          {isLoading ? (
            <div className="text-center py-8 text-muted text-sm">Se încarcă...</div>
          ) : error ? (
            <div className="text-center py-8 text-muted text-sm">Eroare la încărcare</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">Coșul este gol</div>
          ) : (
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Link href={`/p/${item.slug || ''}`} onClick={onClose}>
                    <div className="relative w-12 h-12 bg-bg-soft rounded border border-line flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/p/${item.slug || ''}`} onClick={onClose}>
                      <p className="text-sm font-medium text-ink truncate hover:text-primary transition-micro">
                        {item.productName}
                      </p>
                    </Link>
                    <p className="text-xs text-muted">
                      {item.qty} × {item.unitPrice.toLocaleString('ro-RO')} lei
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {(item.subtotal || (item.unitPrice * item.qty)).toLocaleString('ro-RO')} lei
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {cartItems.length > 0 && (
            <div className="border-t border-line pt-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-ink">Total:</span>
                <span className="text-lg font-semibold text-primary">
                  {total.toLocaleString('ro-RO')} {cart?.totals?.currency || 'RON'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {cartItems.length > 0 && (
            <div className="space-y-2">
              <Link href="/cos" onClick={onClose}>
                <Button className="w-full transition-micro">
                  Vezi coșul
                </Button>
              </Link>
              <Link href="/finalizare" onClick={onClose}>
                <Button variant="outline" className="w-full transition-micro">
                  Finalizează
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
