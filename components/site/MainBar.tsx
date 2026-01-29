import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Category } from "./SiteHeader";
import CategoriesButton from "./CategoriesButton";
import GlobalSearchTrigger from "../search/GlobalSearchTrigger";
import { Store, ShoppingCart, Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";
import useSWR from "swr";
import type { Cart } from "@/lib/types";

interface MainBarProps {
  categories: Category[];
  suggestions: string[];
  onMegaMenuToggle: (open: boolean) => void;
  onMiniCartToggle: (open: boolean) => void;
}

export function MainBar({ categories, suggestions, onMegaMenuToggle, onMiniCartToggle }: MainBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Fetch cart data for item count - disable auto-revalidation to avoid overwriting changes
  const { data: cart } = useSWR<Cart>('/api/cart', (url: string) =>
    fetch(url, { credentials: 'include', cache: 'no-store' }).then(res => res.json()),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000, // Avoid duplicate requests within 2s
    }
  );
  
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-ink">
            Florist<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
          <GlobalSearchTrigger />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <CategoriesButton />
          
          <Link 
            href="/seller" 
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line hover:bg-bg-soft text-ink text-sm transition-micro"
          >
            <Store className="h-4 w-4" />
            Devino vânzător
          </Link>
          
          <UserMenu />
          
          <Link 
            href="/cos" 
            className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-micro"
          >
            <ShoppingCart className="h-4 w-4" />
            Coș
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMegaMenuToggle(true)}
            className="transition-micro p-2"
            aria-label="Meniul principal"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSearchOpen(!searchOpen)}
            className="transition-micro p-2"
            aria-label="Căutare"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMiniCartToggle(true)}
            className="relative transition-micro p-2"
            aria-label={`Coș de cumpărături (${itemCount} produse)`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="lg:hidden py-4 border-t border-line">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <GlobalSearchTrigger />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchOpen(false)}
              className="text-muted hover:text-ink p-2"
              aria-label="Închide căutarea"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
