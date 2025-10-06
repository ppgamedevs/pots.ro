"use client";

import React, { useEffect } from "react";

export function TOC() {
  useEffect(() => {
    const headings = document.querySelectorAll('article h2, article h3');
    const toc = document.getElementById('toc');
    if (!toc) return;

    // Clear existing TOC
    toc.innerHTML = '';

    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
      }
      
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + heading.id;
      a.textContent = heading.textContent || '';
      a.className = 'hover:text-primary transition-colors';
      li.appendChild(a);
      toc.appendChild(li);
    });
  }, []);

  return (
    <aside className="hidden lg:block lg:sticky lg:top-24 h-max p-4 rounded-xl border border-line bg-white text-sm">
      <div className="font-medium text-ink mb-2">Cuprins</div>
      <ul id="toc" className="space-y-2 text-ink/80" />
    </aside>
  );
}


