"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Heart } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";

export function UserMenu() {
  const { user, loading, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-soft text-ink text-sm transition-micro">
        <User className="h-4 w-4" />
        <span>Cont</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-soft text-ink text-sm transition-micro"
        >
          <User className="h-4 w-4" />
          Contul meu
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-soft text-ink text-sm transition-micro"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">
          Salut, {user.name || user.email.split('@')[0]}
        </span>
        <span className="sm:hidden">Cont</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-line bg-white shadow-elev p-2 z-50">
          <div className="px-3 py-2 border-b border-line">
            <div className="text-sm font-medium text-ink">
              {user.name || 'Utilizator'}
            </div>
            <div className="text-xs text-muted">{user.email}</div>
          </div>
          
          <div className="py-1">
            <Link
              href="/favorites"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-bg-soft rounded transition-micro"
              onClick={() => setIsOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Favorite
            </Link>
            
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-bg-soft rounded transition-micro"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Profil
            </Link>
            
            {user.role === 'seller' && (
              <Link
                href="/seller"
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-bg-soft rounded transition-micro"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                Dashboard Vânzător
              </Link>
            )}
            
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-bg-soft rounded transition-micro"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
            
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-micro w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Ieșire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
