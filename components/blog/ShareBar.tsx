"use client";

import React from "react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex items-center justify-between border-y border-line mt-8">
      <div className="text-sm text-ink/70">Îți place? Distribuie</div>
      <div className="flex items-center gap-2">
        <a className="chip" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className="chip" href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">Twitter</a>
        <button className="chip" onClick={copyToClipboard}>Copiază link</button>
      </div>
    </div>
  );
}


