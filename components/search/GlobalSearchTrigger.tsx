"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Suggestion {
  title: string;
  slug: string;
}

export default function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        const { suggestions: sugs } = await r.json();
        setSuggestions(sugs || []);
      } catch (error) {
        console.error("Search suggestions error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(q)}`;
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line hover:bg-bg-soft text-ink text-sm transition-micro" 
        aria-label="Căutare (Ctrl/⌘K)"
      >
        <span className="i-lucide:search h-4 w-4" /> 
        Căutare 
        <kbd className="ml-2 text-muted border border-line rounded px-1 text-xs">Ctrl/⌘K</kbd>
      </button>

      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-24 px-4"
          onClick={() => setOpen(false)}
        >
          <div 
            ref={modalRef}
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-elev" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="i-lucide:search h-5 w-5 text-muted" />
              <span className="text-sm font-medium text-ink">Caută produse...</span>
              <button 
                onClick={() => setOpen(false)}
                className="ml-auto p-1 hover:bg-gray-100 rounded"
                aria-label="Închide căutarea"
              >
                <span className="i-lucide:x h-4 w-4 text-muted" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 border border-line rounded-xl px-4 py-3">
                <input 
                  autoFocus 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  placeholder="Caută produse..." 
                  className="w-full outline-none text-ink placeholder:text-muted" 
                />
                {loading && <span className="i-lucide:loader-2 h-4 w-4 animate-spin text-muted" />}
              </div>
            </form>

            <div className="mt-3 max-h-64 overflow-y-auto">
              {suggestions.length > 0 && (
                <div className="space-y-1">
                  {suggestions.map(s => (
                    <Link 
                      key={s.slug} 
                      href={`/p/${s.slug}`} 
                      className="block px-3 py-2 rounded-lg hover:bg-bg-soft transition-micro"
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-sm text-ink">{s.title}</div>
                    </Link>
                  ))}
                </div>
              )}
              
              {q.trim() && (
                <Link 
                  href={`/products?q=${encodeURIComponent(q)}`} 
                  className="block px-3 py-2 text-primary hover:bg-bg-soft rounded-lg transition-micro"
                  onClick={() => setOpen(false)}
                >
                  Vezi toate rezultatele pentru "{q}" →
                </Link>
              )}
              
              {!q.trim() && (
                <div className="px-3 py-2 text-muted text-sm">
                  Începe să tastezi pentru a vedea sugestiile...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
