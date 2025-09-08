"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();
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

        <nav className="hidden md:flex gap-6">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`text-sm hover:text-brand transition ${
                pathname?.startsWith(i.href) ? "text-brand font-medium" : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/search" className="text-sm hover:text-brand">Căutare</Link>
          <Link href="/cart">
            <Button variant="secondary" size="sm">Coș</Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm">Autentificare</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
