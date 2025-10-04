export function HowItWorks() {
  const steps = [
    { 
      n: 1, 
      t: "Aplică online", 
      d: "Completezi formularul în 3 minute. Verificăm actele rapid." 
    },
    { 
      n: 2, 
      t: "Publici produsele", 
      d: "CSV import sau adaugi manual. Imagini clare, prețuri corecte." 
    },
    { 
      n: 3, 
      t: "Primești comenzi", 
      d: "Generezi AWB, livrezi. Payout după livrare confirmată." 
    },
    { 
      n: 4, 
      t: "Crești cu noi", 
      d: "Campanii sezoniere, editoriale și statistici zilnice." 
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-xl font-semibold text-ink">Cum funcționează</h2>
      <div className="mt-6 grid md:grid-cols-4 gap-6">
        {steps.map(step => (
          <div key={step.n} className="rounded-xl border border-line p-5 bg-white hover:shadow-card transition-micro">
            <div className="text-primary font-semibold">Pasul {step.n}</div>
            <div className="mt-1 font-medium text-ink">{step.t}</div>
            <div className="text-sm text-ink/70 mt-2">{step.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
