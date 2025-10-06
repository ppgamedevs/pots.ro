"use client";

import React, { useEffect, useState } from "react";

export function TOC() {
  const [headings, setHeadings] = useState<Array<{ id: string; text: string }>>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("article h2"));
    const headingsData = elements.map(el => ({
      id: el.id || el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      text: el.textContent || ''
    }));
    setHeadings(headingsData);

    // Update active section on scroll
    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 100;
      
      elements.forEach((heading) => {
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
    <aside className="sticky top-32 hidden lg:block p-4 rounded-2xl bg-white/60 backdrop-blur-md shadow-sm border border-gray-100 max-h-[80vh] overflow-auto">
      <h3 className="text-sm font-semibold mb-3 text-[#2C3E50] tracking-wide">Cuprins</h3>
      <ul className="space-y-2 text-sm leading-tight">
        {headings.map(h => (
          <li key={h.id}>
            <a 
              href={`#${h.id}`} 
              className={`block py-1 px-2 rounded-md transition-colors ${
                activeId === h.id 
                  ? 'text-[#1B5232] bg-[#D9E4D0]/30 font-medium' 
                  : 'text-gray-700 hover:text-[#1B5232] hover:bg-gray-50'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}


