"use client";

import React, { useEffect, useState } from "react";

export function TOC() {
  const [activeId, setActiveId] = useState<string>('');

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
      a.className = 'block py-2 px-3 text-sm text-[#4B4B4B] hover:text-[#1B5232] transition-colors border-l-2 border-transparent hover:border-[#1B5232]';
      li.appendChild(a);
      toc.appendChild(li);
    });

    // Update active section on scroll
    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 100;
      
      headings.forEach((heading) => {
        const element = heading as HTMLElement;
        const top = element.offsetTop;
        const bottom = top + element.offsetHeight;
        
        if (scrollPosition >= top && scrollPosition < bottom) {
          setActiveId(element.id);
        }
      });
    };

    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection();

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
    };
  }, []);

  return (
    <ul id="toc" className="space-y-1">
      {/* TOC items will be populated by JavaScript */}
    </ul>
  );
}


