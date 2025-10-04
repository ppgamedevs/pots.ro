"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("fm_cookie_choice")) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const handleAcceptNecessary = () => {
    localStorage.setItem("fm_cookie_choice", "necessary");
    setOpen(false);
  };

  const handleAcceptAll = () => {
    localStorage.setItem("fm_cookie_choice", "all");
    setOpen(false);
  };

  return (
    <div 
      role="dialog" 
      aria-label="Setări cookie" 
      className="fixed inset-x-3 bottom-3 z-50"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-line bg-white shadow-elev p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3">
        <p className="text-sm text-ink/80">
          Folosim cookie-uri funcționale pentru o experiență mai bună. Poți gestiona preferințele în{" "}
          <Link 
            href="/help/legal/cookies" 
            className="underline hover:text-primary transition-micro"
          >
            Politica Cookies
          </Link>
          .
        </p>
        
        <div className="ms-auto flex gap-2">
          <button 
            onClick={handleAcceptNecessary}
            className="px-4 py-2 rounded-lg border border-line text-sm hover:bg-bg-soft transition-micro"
          >
            Doar necesare
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-micro"
          >
            Accept toate
          </button>
        </div>
      </div>
    </div>
  );
}
