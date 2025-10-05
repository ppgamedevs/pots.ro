import React from "react";

export function BlogHero() {
  return (
    <section className="bg-white border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink">Inspirație pentru floristică</h1>
          <p className="mt-4 text-ink/70 max-w-prose">Tendințe, ghiduri practice și povești de la creatori. Articole scurte, clare, cu exemple reale.</p>
        </div>
        <div className="aspect-[16/9] md:aspect-[4/3] rounded-2xl overflow-hidden border border-line bg-bgsoft">
          <img src="/images/blog-hero.jpg" className="h-full w-full object-cover" alt="FloristMarket Blog" />
        </div>
      </div>
    </section>
  );
}


