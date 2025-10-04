export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-xl font-semibold text-ink">Comisioane simple</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-line p-6 bg-white hover:shadow-card transition-micro">
          <div className="font-semibold text-ink">Comision vânzare</div>
          <div className="text-3xl font-semibold mt-2 text-ink">
            8% <span className="text-base text-ink/60">/ comandă</span>
          </div>
          <p className="text-sm text-ink/70 mt-3">
            Se aplică la totalul produselor (fără transport). Transparent, fără costuri ascunse.
          </p>
        </div>
        
        <div className="rounded-xl border border-line p-6 bg-white hover:shadow-card transition-micro">
          <div className="font-semibold text-ink">Taxe procesare plăți</div>
          <div className="text-3xl font-semibold mt-2 text-ink">
            conform Netopia
          </div>
          <p className="text-sm text-ink/70 mt-3">
            Procesatorul de plăți percepe comisioane standard pe tranzacție.
          </p>
        </div>
        
        <div className="rounded-xl border border-line p-6 bg-white hover:shadow-card transition-micro">
          <div className="font-semibold text-ink">Payout</div>
          <div className="text-3xl font-semibold mt-2 text-ink">
            0 RON
          </div>
          <p className="text-sm text-ink/70 mt-3">
            Transfer către vânzători după livrare confirmată (programat).
          </p>
        </div>
      </div>
    </section>
  );
}
