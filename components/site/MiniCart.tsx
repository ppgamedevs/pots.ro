"use client";

import { useEffect } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
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

  // Mock cart items
  const cartItems = [
    {
      id: "1",
      title: "Ghiveci ceramică albă",
      price: 45,
      quantity: 1,
      image: "/placeholder.png"
    },
    {
      id: "2", 
      title: "Cutie rotundă din lemn",
      price: 89,
      quantity: 2,
      image: "/placeholder.png"
    }
  ];

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-bg-soft rounded border border-line flex-shrink-0">
                  {/* Image placeholder */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted">
                    {item.quantity} × {item.price} lei
                  </p>
                </div>
                <div className="text-sm font-semibold text-ink">
                  {(item.price * item.quantity).toLocaleString('ro-RO')} lei
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-line pt-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-ink">Total:</span>
              <span className="text-lg font-semibold text-primary">
                {total.toLocaleString('ro-RO')} lei
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full transition-micro"
              onClick={() => {
                // Navigate to cart page
                window.location.href = '/cart';
              }}
            >
              Vezi coșul
            </Button>
            <Button 
              variant="outline" 
              className="w-full transition-micro"
              onClick={() => {
                // Navigate to checkout
                window.location.href = '/checkout';
              }}
            >
              Finalizează
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
