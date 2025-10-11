import Image from "next/image";
import Link from "next/link";

const items = [
  {
    title: "Ghivece & suporturi moderne",
    desc: "Ceramică, beton, metal — stil curat pentru vitrine și amenajări.",
    href: "/c/ghivece",
    img: "/banners/for-florists/pots.jpg",
    alt: "Ghivece și suporturi moderne",
  },
  {
    title: "Panglici & decorațiuni premium",
    desc: "Panglici satin, organza, iută, accesorii și finishing-uri.",
    href: "/c/panglici",
    img: "/banners/for-florists/ribbons.jpg",
    alt: "Panglici și decorațiuni premium",
  },
  {
    title: "Cutiile rotunde din catifea — bestseller 2025",
    desc: "Seturi pe mărimi, fără capac, peste 20 de culori disponibile.",
    href: "/c/cutii-rotunde",
    img: "/banners/for-florists/velvet-round-boxes.jpg",
    alt: "Cutiile rotunde din catifea",
  },
  {
    title: "Accesorii esențiale pentru atelierul tău",
    desc: "Bureți florali, folii, benzi, instrumente — totul într-un singur loc.",
    href: "/c/accesorii",
    img: "/banners/for-florists/tools.jpg",
    alt: "Accesorii esențiale pentru atelier",
  },
];

export default function EverythingForFlorists() {
  return (
    <section aria-labelledby="eff-title" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
      <header className="mb-6">
        <h2 id="eff-title" className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
          Totul pentru florăria ta
        </h2>
        <p className="mt-2 max-w-3xl text-neutral-600">
          Descoperă produse verificate, ambalaje de calitate și livrare rapidă direct din depozitele noastre.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {items.map((it) => (
          <Link
            key={it.title}
            href={it.href}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={it.img}
                alt={it.alt}
                fill
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
              <h3 className="text-white text-xl md:text-2xl font-semibold drop-shadow-sm">
                {it.title}
              </h3>
              <p className="mt-1 text-white/90 text-sm md:text-base">
                {it.desc}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 backdrop-blur group-hover:bg-white transition">
                Vezi colecția <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
