"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export interface PDPActionsProps {
  quantity: number;
  onAdd: (qty: number) => void;
  maxQuantity?: number;
}

export function PDPActions({ quantity, onAdd, maxQuantity = 10 }: PDPActionsProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setSelectedQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAdd(selectedQuantity);
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink">Cantitate:</span>
        
        <div className="flex items-center border border-line rounded-lg">
          <button
            onClick={() => handleQuantityChange(selectedQuantity - 1)}
            disabled={selectedQuantity <= 1}
            className="p-2 hover:bg-bg-soft transition-micro disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Scade cantitatea"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-ink min-w-[3rem] text-center">
            {selectedQuantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(selectedQuantity + 1)}
            disabled={selectedQuantity >= maxQuantity}
            className="p-2 hover:bg-bg-soft transition-micro disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Crește cantitatea"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        size="lg"
        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold transition-micro"
        aria-label="Adaugă produsul în coș"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Adaugă în coș
      </Button>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-12 transition-micro"
          onClick={() => {
            // Handle wishlist
            console.log('Add to wishlist');
          }}
        >
          Adaugă la favorite
        </Button>
        
        <Button
          variant="outline"
          className="flex-1 h-12 transition-micro"
          onClick={() => {
            // Handle share
            console.log('Share product');
          }}
        >
          Distribuie
        </Button>
      </div>
    </div>
  );
}
