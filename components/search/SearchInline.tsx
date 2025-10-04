"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchInlineProps {
  defaultQuery?: string;
  defaultSort?: string;
}

export default function SearchInline({ defaultQuery = "", defaultSort = "relevance" }: SearchInlineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultQuery);
  const [sort, setSort] = useState(defaultSort);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <form onSubmit={handleSearch} className="flex-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Caută produse..."
            className="field flex-1"
          />
          <button type="submit" className="btn-primary">
            <span className="i-lucide:search h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2">
        <label className="text-sm text-ink font-medium">Sortare:</label>
        <select
          value={sort}
          onChange={e => handleSortChange(e.target.value)}
          className="field w-auto min-w-[140px]"
        >
          <option value="relevance">Relevanță</option>
          <option value="price_asc">Preț crescător</option>
          <option value="price_desc">Preț descrescător</option>
          <option value="recent">Cele mai noi</option>
        </select>
      </div>
    </div>
  );
}
