import React from "react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex items-center justify-between border-y border-line mt-8">
      <div className="text-sm text-ink/70">Îți place? Distribuie</div>
      <div className="flex items-center gap-2">
        <a className="chip" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank">Facebook</a>
        <a className="chip" href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank">Twitter</a>
        <button className="chip" onClick={() => navigator.clipboard.writeText(url)}>Copiază link</button>
      </div>
    </div>
  );
}


