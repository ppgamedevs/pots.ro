import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { H1, P } from "@/components/ui/typography";
import { Star, Shield, Truck, RotateCcw, Headphones } from "lucide-react";

type Seller = {
  displayName: string;
  description: string;
  verified: boolean;
  rating: number;
  totalProducts: number;
  bannerUrl?: string;
  logoUrl?: string;
};

type SellerHeaderProps = {
  seller: Seller;
};

export function SellerHeader({ seller }: SellerHeaderProps) {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden">
        {seller.bannerUrl ? (
          <Image
            src={seller.bannerUrl}
            alt={`Banner ${seller.displayName}`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand/40" />
        )}
        
        {/* Logo overlay */}
        {seller.logoUrl && (
          <div className="absolute top-4 left-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
              <Image
                src={seller.logoUrl}
                alt={`Logo ${seller.displayName}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Seller info */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <H1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {seller.displayName}
          </H1>
          {seller.verified && (
            <Badge variant="success" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Shield className="w-3 h-3 mr-1" />
              Verificat
            </Badge>
          )}
        </div>
        
        <P className="text-slate-600 dark:text-slate-400 mb-4 max-w-2xl">
          {seller.description}
        </P>
        
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-medium">{seller.rating}</span>
          </div>
          <div>{seller.totalProducts} produse</div>
        </div>
      </div>

      {/* Marketplace info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Shield className="h-6 w-6 text-emerald-600" />
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">Verificat</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Partener verificat</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Truck className="h-6 w-6 text-blue-600" />
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">Livrare</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Gestionată de Pots</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">Retur</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Simplu și rapid</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Headphones className="h-6 w-6 text-purple-600" />
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">Suport</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">7/7 prin Pots</div>
          </div>
        </div>
      </div>
    </div>
  );
}
