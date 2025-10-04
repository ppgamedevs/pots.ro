export function Benefits() {
  const items = [
    { 
      title: "Public dedicat floristicii", 
      text: "Ajungi direct la clienții și profesioniștii din nișa ta." 
    },
    { 
      title: "Plăți & facturi automate", 
      text: "Netopia + facturi automate; încasări la livrare confirmată." 
    },
    { 
      title: "AWB & curieri integrați", 
      text: "Cargus/DPD la un click; etichete din dashboard." 
    },
    { 
      title: "Suport și vizibilitate", 
      text: "Promovări sezoniere, colecții și conținut editorial." 
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-xl font-semibold text-ink">De ce să vinzi pe FloristMarket</h2>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-line p-5 bg-white hover:shadow-card transition-micro">
            <div className="font-medium text-ink">{item.title}</div>
            <p className="text-sm text-ink/70 mt-2">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
