"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Grid3X3, ChevronDown } from "lucide-react";

export default function CategoriesButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line hover:bg-bg-soft text-sm transition-micro"
      >
        <Grid3X3 className="h-4 w-4" />
        Categorii
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div 
          role="menu" 
          className="absolute left-0 mt-2 w-[840px] rounded-2xl border border-line bg-white shadow-elev p-6 z-50"
        >
          {/* 3 coloane + card promo */}
          <div className="grid grid-cols-3 gap-8">
            <MenuColumn 
              title="Ghivece" 
              items={["Ceramică", "Plastic", "Metal", "Lemn"]} 
              base="/c/ghivece" 
            />
            <MenuColumn 
              title="Cutii" 
              items={["Rotunde", "Pătrate", "Rectangulare", "Speciale"]} 
              base="/c/cutii" 
            />
            <MenuColumn 
              title="Ambalaje & Accesorii" 
              items={["Hârtie", "Textil", "Unelte", "Decorative"]} 
              base="/c/ambalaje" 
            />
          </div>
          <div className="mt-4 text-right">
            <Link 
              href="/c" 
              className="text-sm underline hover:text-primary transition-micro"
            >
              Vezi toate categoriile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuColumn({ 
  title, 
  items, 
  base 
}: { 
  title: string; 
  items: string[]; 
  base: string; 
}) {
  return (
    <div>
      <div className="font-medium mb-2 text-ink">{title}</div>
      <ul className="space-y-1 text-sm">
        {items.map(item => (
          <li key={item}>
            <Link 
              className="text-ink/80 hover:text-ink transition-micro" 
              href={`${base}`}
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
