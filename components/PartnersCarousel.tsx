"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const items = [
  { name: "NETOPIA", src: "/partners/netopia.svg" },
  { name: "Cargus", src: "/partners/cargus.svg" },
  { name: "Cardboard Street", src: "/partners/cardboard-street.svg" },
  { name: "Potto", src: "/partners/potto.svg" },
];

export default function PartnersCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // auto-play
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let i = 0;
    const id = setInterval(() => {
      if (paused) return;
      i = (i + 1) % items.length;
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section aria-label="Parteneri" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative overflow-x-auto snap-x snap-mandatory rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur"
      >
        <div className="flex w-full">
          {items.map((p) => (
            <div key={p.name} className="min-w-full snap-start grid place-items-center h-28">
              <div className="relative h-14 w-44 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition">
                <Image src={p.src} alt={p.name} fill sizes="176px" className="object-contain p-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
