"use client";

import { Truck, Clock, Shield } from "lucide-react";

export interface PDPShippingProps {
  carriers: string[];
  eta: string;
  freeShippingThreshold?: number;
  currentPrice?: number;
}

export function PDPShipping({ 
  carriers, 
  eta, 
  freeShippingThreshold = 200,
  currentPrice = 0 
}: PDPShippingProps) {
  const isFreeShipping = currentPrice >= freeShippingThreshold;
  const remainingForFreeShipping = freeShippingThreshold - currentPrice;

  return (
    <div className="space-y-4 p-4 bg-bg-soft rounded-lg">
      <h3 className="text-lg font-semibold text-ink">Livrare și retur</h3>
      
      {/* Shipping Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-ink">Livrare estimată: {eta}</p>
            <p className="text-xs text-muted">Prin {carriers.join(', ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-ink">Procesare comandă</p>
            <p className="text-xs text-muted">1-2 zile lucrătoare</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-ink">Retur gratuit</p>
            <p className="text-xs text-muted">14 zile de la livrare</p>
          </div>
        </div>
      </div>

      {/* Free Shipping Progress */}
      {!isFreeShipping && remainingForFreeShipping > 0 && (
        <div className="mt-4 p-3 bg-white border border-line rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">
              Livrare gratuită
            </span>
            <span className="text-sm text-muted">
              {remainingForFreeShipping.toLocaleString('ro-RO')} lei rămași
            </span>
          </div>
          
          <div className="w-full bg-line rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-micro"
              style={{ 
                width: `${Math.min((currentPrice / freeShippingThreshold) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {isFreeShipping && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            ✓ Livrare gratuită inclusă
          </p>
        </div>
      )}
    </div>
  );
}
