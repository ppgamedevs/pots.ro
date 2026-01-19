"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { CommandPaletteControlled } from "./search/command-palette-controlled";
import MiniCart from "./cart/MiniCart";
import { useUser } from "@/lib/hooks/useUser";

export function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading } = useUser();
  
  const nav = [
    { href: "/c/ghivece", label: "Ghivece" },
    { href: "/c/cutii", label: "Cutii" },
    { href: "/c/accesorii", label: "Accesorii" },
  ];

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-white/10"
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">Pots<span className="text-brand">.ro</span></Link>

        <nav className="hidden md:flex gap-6" role="navigation" aria-label="Main navigation">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`text-sm hover:text-brand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1 ${
                pathname?.startsWith(i.href) ? "text-brand font-medium" : "text-slate-700 dark:text-slate-300"
              }`}
              aria-current={pathname?.startsWith(i.href) ? "page" : undefined}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setSearchOpen(true)}
            aria-label="Open search dialog"
          >
            Căutare ⌘K
          </Button>
          {/* Admin button - only visible to admin users */}
          {!loading && user?.role === 'admin' && (
            <Link href="/admin">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                aria-label="Go to admin panel"
              >
                Admin Panel
              </Button>
            </Link>
          )}
          <Link 
            href="/components-demo" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Components
          </Link>
          <Link 
            href="/forms-demo" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Forms
          </Link>
          <Link 
            href="/demo-form" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Demo Form
          </Link>
          <Link 
            href="/ui-demo" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            UI Demo
          </Link>
          <Link 
            href="/dashboard-demo" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Dashboard
          </Link>
          <Link 
            href="/seller-dashboard" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Vânzător
          </Link>
          <Link 
            href="/admin-demo" 
            className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
          >
            Admin
          </Link>
          <MiniCart />
          <Link href="/auth/autentificare">
            <Button size="sm" aria-label="Sign in to your account">Autentificare</Button>
          </Link>
        </div>
      </div>
      <CommandPaletteControlled open={searchOpen} onOpenChange={setSearchOpen} />
    </motion.header>
  );
}
