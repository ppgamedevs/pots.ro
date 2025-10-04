"use client";
import { useState } from "react";
import { searchHelp, ARTICLES } from "@/lib/help/data";
import Link from "next/link";
import { Search } from "lucide-react";

export default function HelpSearch() {
  const [q, setQ] = useState("");
  const results = q ? searchHelp(q) : ARTICLES.slice(0, 6);
  
  return (
    <div className="w-full max-w-2xl">
      <label className="sr-only" htmlFor="help-search">Caută în Help</label>
      <div className="flex items-center gap-2 border border-line rounded-xl px-4 py-3 bg-white">
        <Search className="h-5 w-5 text-muted" />
        <input 
          id="help-search" 
          value={q} 
          onChange={e => setQ(e.target.value)}
          placeholder="Caută: retur, AWB, factură…" 
          className="w-full outline-none" 
        />
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {results.map(r => (
          <Link 
            key={r.slug} 
            href={`/help/${r.category}/${r.slug}`} 
            className="rounded-lg border border-line p-4 hover:shadow-card transition-micro"
          >
            <div className="text-sm text-muted capitalize">{r.category.replace('-', ' ')}</div>
            <div className="font-medium mt-1">{r.title}</div>
            <div className="text-sm text-ink/70 mt-1 line-clamp-2">{r.excerpt}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
