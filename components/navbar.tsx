"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { CommandPaletteControlled } from "./search/command-palette-controlled";
import MiniCart from "./cart/MiniCart";
import { useUser } from "@/lib/hooks/useUser";
import { Sheet } from "./ui/sheet";
import { Menu, Search } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useUser();
  
  const nav = [
    { href: "/c/ghivece", label: "Ghivece" },
    { href: "/c/cutii", label: "Cutii" },
    { href: "/c/accesorii", label: "Accesorii" },
  ];

  const extraLinks = [
    { href: "/components-demo", label: "Components" },
    { href: "/forms-demo", label: "Forms" },
    { href: "/demo-form", label: "Demo Form" },
    { href: "/ui-demo", label: "UI Demo" },
    { href: "/dashboard-demo", label: "Dashboard" },
    { href: "/seller-dashboard", label: "Vânzător" },
    { href: "/admin-demo", label: "Admin" },
  ];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };

    onChange();
    // Safari fallback
    // eslint-disable-next-line deprecation/deprecation
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
    // eslint-disable-next-line deprecation/deprecation
    else mq.addListener(onChange);

    return () => {
      // eslint-disable-next-line deprecation/deprecation
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", onChange);
      // eslint-disable-next-line deprecation/deprecation
      else mq.removeListener(onChange);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-white/10"
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 w-9 px-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="font-semibold text-lg">Pots<span className="text-brand">.ro</span></Link>
        </div>

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

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setSearchOpen(true)}
            aria-label="Open search dialog"
          >
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Căutare</span>
            <span className="hidden lg:inline">&nbsp;⌘K</span>
          </Button>
          {/* Admin button - only visible to admin users */}
          {!loading && user?.role === 'admin' && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Link href="/admin" aria-label="Go to admin panel">
                Admin Panel
              </Link>
            </Button>
          )}
          <div className="hidden xl:flex items-center gap-2">
            {extraLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md px-1"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <MiniCart />
          <Button asChild size="sm" aria-label="Sign in to your account">
            <Link href="/autentificare">Autentificare</Link>
          </Button>
        </div>
      </div>
      <CommandPaletteControlled open={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="Meniu"
        description="Navigare rapidă"
        side="left"
      >
        <nav className="space-y-2" aria-label="Mobile navigation">
          <div className="text-xs uppercase tracking-wide text-slate-500">Categorii</div>
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setMobileOpen(false)}
              className={
                `block rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-white/10 ` +
                (pathname?.startsWith(i.href)
                  ? "bg-bg-soft text-brand"
                  : "bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100")
              }
            >
              {i.label}
            </Link>
          ))}

          <div className="pt-3 text-xs uppercase tracking-wide text-slate-500">Altele</div>
          {extraLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60"
            >
              {l.label}
            </Link>
          ))}

          {!loading && user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-lg px-3 py-2 text-sm border border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40"
            >
              Admin Panel
            </Link>
          )}

          <Link
            href="/autentificare"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60"
          >
            Autentificare
          </Link>
        </nav>
      </Sheet>
    </motion.header>
  );
}
