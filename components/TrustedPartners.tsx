"use client";
import Image from "next/image";

type Partner = {
  name: string;
  src: string;
  href?: string;
  width?: number;
  height?: number;
  variant?: "default" | "light"; // light = logo foarte deschis, aplicăm filtre pt contrast
};

const partners: Partner[] = [
  { name: "Cardboard Street", src: "/partners/cardboard-street.png", href: "https://cardboardstreet.eu", width: 200, height: 40 },
  { name: "Potto", src: "/partners/potto.png", href: "https://potto.ro", width: 120, height: 40, variant: "light" }, // logo deschis
];

const badges = [
  { title: "Plăți securizate", desc: "Online, rapid și sigur", emoji: "🔒" },
  { title: "Livrare fiabilă", desc: "Prin curieri naționali", emoji: "🚚" },
  { title: "Selleri verificați", desc: "profiluri auditate", emoji: "✅" },
  { title: "Retur 14 zile", desc: "proces simplu, transparent", emoji: "↩️" },
];

export default function TrustedPartners() {
  return (
    <section aria-labelledby="partners-title" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
      <div className="rounded-3xl border border-neutral-200 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="p-6 md:p-10">
          <header className="mb-6">
            <h2 id="partners-title" className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
              Parteneri de încredere
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-600">
              „În parteneriat cu producători locali din România, florării independente și furnizori certificați FSC."
              <br />
              „Colaborăm cu designeri florali și școli de artă florală pentru a promova excelența locală."
            </p>
          </header>

          {/* bare logo row – fără casete */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 md:gap-x-14">
            {partners.map((p) => {
              const img = (
                <Image
                  src={p.src}
                  alt={p.name}
                  width={p.width ?? 160}
                  height={p.height ?? 40}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
                  className={[
                    "object-contain align-middle",
                    "grayscale opacity-80 transition will-change-auto hover:opacity-100 hover:grayscale-0",
                    p.variant === "light" ? "invert contrast-125 brightness-90" : "", // FIX pt logo-uri foarte deschise (ex. Potto)
                  ].join(" ")}
                  priority={false}
                />
              );
              return p.href ? (
                <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" aria-label={p.name}>
                  {img}
                </a>
              ) : (
                <div key={p.name} aria-label={p.name}>{img}</div>
              );
            })}
          </div>

          {/* trust badges */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div key={b.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div aria-hidden className="text-xl">{b.emoji}</div>
                <div className="mt-1 font-medium text-neutral-900">{b.title}</div>
                <div className="text-sm text-neutral-600">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}