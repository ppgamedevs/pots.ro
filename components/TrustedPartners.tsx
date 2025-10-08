import Image from "next/image";

const partners = [
  { name: "NETOPIA Payments", src: "/partners/netopia.svg", href: "https://netopia-payments.com" },
  { name: "Cargus", src: "/partners/cargus.svg", href: "https://www.cargus.ro" },
  { name: "Cardboard Street", src: "/partners/cardboard-street.svg", href: "https://cardboardstreet.eu" },
  { name: "Potto", src: "/partners/potto.svg", href: "#" }, // wordmark placeholder
];

const badges = [
  { title: "Plăți securizate", desc: "Visa / Mastercard / Netopia", icon: "/partners/icons/lock.svg" },
  { title: "Livrare rapidă", desc: "24–48h prin curieri naționali", icon: "/partners/icons/van.svg" },
  { title: "Selleri verificați", desc: "profiluri auditate manual", icon: "/partners/icons/check.svg" },
  { title: "Retur 14 zile", desc: "proces simplu, transparent", icon: "/partners/icons/return.svg" },
];

export default function TrustedPartners() {
  return (
    <section aria-labelledby="partners-title" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-14">
      <div className="rounded-3xl bg-gradient-to-b from-white to-neutral-50 border border-neutral-200 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
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
        </div>

        {/* Logos grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center">
          {partners.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
               className="group flex items-center justify-center rounded-xl border border-neutral-200 bg-white/80 backdrop-blur hover:bg-white transition">
              <div className="relative h-14 w-40 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 transition">
                <Image src={p.src} alt={p.name} fill className="object-contain p-3" sizes="160px" />
              </div>
              <span className="sr-only">{p.name}</span>
            </a>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div key={b.title} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-start gap-3">
              <Image src={b.icon} alt="" width={24} height={24} />
              <div>
                <div className="font-medium text-neutral-900">{b.title}</div>
                <div className="text-sm text-neutral-600">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
