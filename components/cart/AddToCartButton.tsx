"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { mutate } from "swr";

interface AddToCartButtonProps {
  productId: number;
  stockQty: number;
  initialQty?: number;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showQuantitySelector?: boolean;
  onAdd?: () => void;
}

export default function AddToCartButton({
  productId,
  stockQty,
  initialQty = 1,
  variant = "default",
  size = "default",
  className = "",
  showQuantitySelector = false,
  onAdd
}: AddToCartButtonProps) {
  const { toast } = useToast();
  const [qty, setQty] = useState(initialQty);
  const [loading, setLoading] = useState(false);

  const isOutOfStock = stockQty === 0;
  const isDisabled = isOutOfStock || loading || qty < 1 || qty > 99;

  const handleAddToCart = async () => {
    if (isDisabled) return;

    setLoading(true);
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          qty
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "Insufficient stock") {
          toast(`Doar ${error.availableStock} produse disponibile în stoc.`, "error");
          return;
        }
        throw new Error(error.error || 'Failed to add to cart');
      }

      // Refresh cart data
      mutate('/api/cart');

      toast(`Produsul a fost adăugat în coș (${qty} bucăți).`, "success");

      onAdd?.();
    } catch (error) {
      toast("Nu s-a putut adăuga produsul în coș.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (newQty: number) => {
    const clampedQty = Math.max(1, Math.min(99, Math.min(newQty, stockQty)));
    setQty(clampedQty);
  };

  const incrementQty = () => {
    handleQtyChange(qty + 1);
  };

  const decrementQty = () => {
    handleQtyChange(qty - 1);
  };

  if (showQuantitySelector) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={decrementQty}
            disabled={qty <= 1 || isOutOfStock}
            className="h-8 w-8 p-0 rounded-r-none"
            aria-label="Scade cantitatea"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Input
            type="number"
            value={qty}
            onChange={(e) => handleQtyChange(Number(e.target.value))}
            min={1}
            max={Math.min(99, stockQty)}
            className="h-8 w-16 text-center border-0 rounded-none focus:ring-0"
            disabled={isOutOfStock}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={incrementQty}
            disabled={qty >= Math.min(99, stockQty) || isOutOfStock}
            className="h-8 w-8 p-0 rounded-l-none"
            aria-label="Crește cantitatea"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isDisabled}
          variant={variant === "default" || variant === "link" ? "primary" : variant}
          size={size === "default" ? "md" : size === "icon" ? "md" : size}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Stoc epuizat" : loading ? "Se adaugă..." : "Adaugă în coș"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      variant={variant === "default" || variant === "link" ? "primary" : variant}
      size={size === "default" ? "md" : size === "icon" ? "md" : size}
      className={className}
      aria-label={isOutOfStock ? "Produsul nu este în stoc" : "Adaugă în coș"}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {isOutOfStock ? "Stoc epuizat" : loading ? "Se adaugă..." : "Adaugă în coș"}
    </Button>
  );
}
