import React from "react";

export function TOC() {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-24 h-max p-4 rounded-xl border border-line bg-white text-sm">
      <div className="font-medium text-ink mb-2">Cuprins</div>
      <ul id="toc" className="space-y-2 text-ink/80" />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: `(
        function(){
          const hs=[...document.querySelectorAll('article h2, article h3')];
          const toc=document.getElementById('toc');
          if(!toc)return;
          hs.forEach(h=>{
            if(!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-');
            var li=document.createElement('li');
            var a=document.createElement('a');
            a.href='#'+h.id; a.textContent=h.textContent; li.appendChild(a); toc.appendChild(li);
          });
        })();
      `}} />
    </aside>
  );
}


