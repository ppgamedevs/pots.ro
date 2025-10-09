import Link from "next/link";

export function SellerHero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink">
            Devino vânzător pe FloristMarket
          </h1>
          <p className="mt-4 text-ink/70 max-w-prose">
            Marketplace-ul dedicat floristicii: ghivece, cutii, ambalaje și accesorii. 
            Vinde simplu, în siguranță, către mii de clienți.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link 
              href="/seller/apply" 
              className="inline-flex px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro"
            >
              Aplică acum
            </Link>
            <Link 
              href="/seller/requirements" 
              className="inline-flex px-5 py-3 border border-line rounded-lg hover:bg-bg-soft transition-micro"
            >
              Cerințe & comisioane
            </Link>
          </div>
        </div>
        <div className="aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden border border-line bg-bg-soft">
          <img 
            src="/images/seller.jpg" 
            alt="Devino vânzător" 
            className="h-full w-full object-cover" 
          />
        </div>
      </div>
    </section>
  );
}
