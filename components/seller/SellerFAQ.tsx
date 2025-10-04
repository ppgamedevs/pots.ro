export function SellerFAQ() {
  const questions = [
    { 
      q: "Cine poate vinde?", 
      a: "Persoane juridice din domeniul floristicii: producători, importatori, magazine specializate." 
    },
    { 
      q: "Ce documente sunt necesare?", 
      a: "CUI, IBAN, date firmă. Politica de retur și date de contact valide." 
    },
    { 
      q: "Cum primesc banii?", 
      a: "Payout automat către IBAN după ce comanda este marcată livrată." 
    },
    { 
      q: "Pot importa produse prin CSV?", 
      a: "Da. Oferim template CSV și import în dashboard." 
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="text-xl font-semibold text-ink">Întrebări frecvente</h2>
      <div className="mt-6 divide-y divide-line bg-white rounded-xl border border-line">
        {questions.map((item) => (
          <div key={item.q} className="p-5">
            <div className="font-medium text-ink">{item.q}</div>
            <div className="text-sm text-ink/70 mt-1">{item.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
