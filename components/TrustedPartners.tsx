"use client";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Partner = { name: string; src: string; href?: string; width?: number; height?: number };

const partners: Partner[] = [
  { name: "Cardboard Street", src: "/partners/cardboard-street-test.svg", href: "https://cardboardstreet.eu", width: 200, height: 56 },
  { name: "Potto", src: "/partners/potto.svg", href: "#", width: 140, height: 56 },
];

const badges = [
  { title: "Plăți securizate", desc: "Online, rapid și sigur", emoji: "🔒" },
  { title: "Livrare fiabilă", desc: "Prin curieri naționali", emoji: "🚚" },
  { title: "Selleri verificați", desc: "profiluri auditate", emoji: "✅" },
  { title: "Retur 14 zile", desc: "proces simplu, transparent", emoji: "↩️" },
];

export default function TrustedPartners() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="partners-title" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
      <div className="rounded-3xl border border-neutral-200 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="p-6 md:p-10">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 id="partners-title" className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
                Parteneri de încredere
              </h2>
              <p className="mt-2 max-w-2xl text-neutral-600">
                „În parteneriat cu producători locali din România, florării independente și furnizori certificați FSC."
                <br />
                „Colaborăm cu designeri florali și școli de artă florală pentru a promova excelența locală."
              </p>
            </div>
          </header>

              {/* Partner Logos */}
              <div
                className="mt-8 grid grid-cols-2 gap-6 max-w-md mx-auto"
                role="list"
                aria-label="Logo parteneri"
              >
                {partners.map((p) => {
                  const Core = (
                    <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white h-20">
                      <img
                        src={p.src}
                        alt={p.name}
                        width={p.width ?? 160}
                        height={p.height ?? 56}
                        className="grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition will-change-auto object-contain"
                        loading="lazy"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  );
                  return p.href ? (
                    <a
                      key={p.name}
                      role="listitem"
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={prefersReducedMotion ? "" : "hover:-translate-y-0.5 transition-transform"}
                      aria-label={p.name}
                    >
                      {Core}
                    </a>
                  ) : (
                    <div key={p.name} role="listitem">{Core}</div>
                  );
                })}
              </div>


          {/* Trust badges */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div key={b.title} className="rounded-xl border border-neutral-200 bg-white p-4">
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
