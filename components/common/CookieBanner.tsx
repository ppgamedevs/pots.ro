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
      <div className="mx-auto max-w-5xl rounded-2xl border border-line bg-white shadow-elev p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-ink mb-2">Cookie-uri și confidențialitate</h3>
            <p className="text-sm text-ink/80 leading-relaxed">
              Folosim cookie-uri funcționale pentru o experiență mai bună. 
              Poți gestiona preferințele în{" "}
              <Link 
                href="/privacy" 
                className="text-primary hover:underline transition-micro"
              >
                Politica de confidențialitate
              </Link>
              .
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleAcceptNecessary}
              className="btn-outline flex-1 md:flex-none"
            >
              Doar necesare
            </button>
            <button 
              onClick={handleAcceptAll}
              className="btn-primary flex-1 md:flex-none"
            >
              Accept toate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
