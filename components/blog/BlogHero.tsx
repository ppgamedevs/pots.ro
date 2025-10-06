import React from "react";

export function BlogHero() {
  return (
    <section className="bg-white border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink">Ghiduri Expert în Aranjamente Florale 2025</h1>
          <p className="mt-4 text-ink/70 max-w-prose">Descoperă cele mai complete ghiduri pentru ghivece ceramice premium, plante interioare și design floral modern în România. Expertiza de specialiști și soluții adaptate pentru clima locală.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Expert România</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">2025</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Ghiduri Complete</span>
          </div>
        </div>
        <div className="aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden border border-line bg-bgsoft">
          <img src="/blog/buchet-galben.png" className="h-full w-full object-cover" alt="Tendințe Design Floral România 2025" />
        </div>
      </div>
    </section>
  );
}


