"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function TermsPage() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const sections = [
    {
      id: "scope",
      title: "Scop și aplicabilitate",
      content: `Aceste Termeni și Condiții reglementează utilizarea platformei FloristMarket.ro și serviciile oferite prin intermediul acesteia.

Platforma este destinată comerțului electronic în domeniul floristicii, incluzând ghivece, cutii, ambalaje și accesorii decorative.

Utilizatorii pot fi:
- Cumpărători (persoane fizice sau juridice)
- Vânzători (persoane juridice autorizate)
- Vizitatori (persoane care navighează fără să creeze cont)`
    },
    {
      id: "account",
      title: "Cont și autentificare",
      content: `Pentru a plasa comenzi sau să devii vânzător, trebuie să creezi un cont.

Datele necesare pentru cont:
- Nume complet
- Adresă de email validă
- Număr de telefon
- Adresă de livrare (pentru cumpărători)
- Date firma (pentru vânzători)

Este responsabilitatea ta să:
- Menții confidențialitatea parolei
- Actualizezi datele când se schimbă
- Anunți imediat orice utilizare neautorizată a contului`
    },
    {
      id: "orders",
      title: "Comenzi și procesare",
      content: `Procesul de comandă:
1. Adaugi produse în coș
2. Completezi datele de livrare și facturare
3. Selectezi metoda de plată
4. Confirmi comanda

Odată confirmată, comanda este procesată automat și trimisă vânzătorului pentru livrare.`
    },
    {
      id: "cancellation",
      title: "Politica de anulare comandă",
      content: `Anularea comenzii înainte de confirmarea plății:
- Poți anula oricând înainte ca vânzătorul să confirme comanda
- Rambursarea este instantanee
- Nu se aplică taxe de anulare

Anularea comenzii după confirmarea plății:
- Doar cu aprobarea vânzătorului
- Vânzătorul poate refuza anularea dacă produsul a fost deja expediat
- Costurile de anulare sunt suportate de client
- Rambursarea se procesează în 3-5 zile lucrătoare

Anularea comenzii după expediere:
- Nu se poate anula comanda după expediere
- Aplică politica de retur pentru produsele care nu îți convin
- Vezi secțiunea "Retururi" pentru detalii complete`
    },
    {
      id: "payments",
      title: "Plăți și facturare",
      content: `Metode de plată acceptate:
- Carduri bancare (Visa, Mastercard)
- PayPal
- Transfer bancar
- Plata la livrare (pentru anumite produse)

Procesarea plăților se face prin Netopia, procesator autorizat de BNR.

Facturile sunt generate automat și trimise pe email după confirmarea plății.

Pentru vânzători:
- Comisionul platformei este de 8% din valoarea produselor
- Plățile către vânzători se fac după livrarea confirmată
- Termenul de plată: 7-14 zile lucrătoare`
    },
    {
      id: "shipping",
      title: "Livrare și transport",
      content: `Livrarea se face prin curieri autorizați:
- Fan Courier
- DPD
- Cargus
- Sameday

Termenele de livrare:
- București: 1-2 zile lucrătoare
- Alte orașe: 2-4 zile lucrătoare
- Zonele rurale: 3-5 zile lucrătoare

Costurile de transport:
- Gratuit pentru comenzi peste 200 RON
- 15-25 RON pentru comenzi sub 200 RON
- Costul exact se calculează la checkout

Urmărirea comenzii se face prin AWB trimis pe email.`
    },
    {
      id: "returns",
      title: "Retur și anulări",
      content: `Dreptul de retur:
- 14 zile calendaristice de la primirea produsului
- Produsul trebuie să fie în starea originală
- Ambalația originală trebuie păstrată

Procesul de retur:
1. Soliciți returul prin contul personal
2. Așteptați aprobarea vânzătorului
3. Trimiteți produsul conform instrucțiunilor
4. Primiți rambursarea după verificare

Costurile de retur:
- Pentru produse defecte: suportate de vânzător
- Pentru schimbarea de părere: suportate de cumpărător

Rambursarea se face în aceeași modalitate de plată folosită la comandă.`
    },
    {
      id: "liability",
      title: "Răspundere și limitări",
      content: `FloristMarket.ro:
- Nu este responsabil pentru calitatea produselor vândute de terți
- Nu garantează disponibilitatea permanentă a produselor
- Nu răspunde pentru întârzierile de la curieri
- Nu răspunde pentru daunele cauzate de utilizarea incorectă a produselor

Vânzătorii sunt responsabili pentru:
- Calitatea și conformitatea produselor
- Respectarea termenelor de livrare
- Gestionarea retururilor și garanțiilor
- Respectarea legislației aplicabile

Utilizatorii sunt responsabili pentru:
- Verificarea corectitudinii datelor introduse
- Respectarea instrucțiunilor de utilizare
- Protejarea contului și datelor personale`
    },
    {
      id: "legislation",
      title: "Legislație aplicabilă",
      content: `Aceste Termeni și Condiții sunt supuse legislației române.

Disputele se rezolvă prin:
1. Negociere directă
2. Mediere (ANPC)
3. Arbitraj sau instanțe competente

Pentru reclamații, contactați:
- Email: legal@floristmarket.ro
- ANPC: www.anpc.ro
- SOL: www.sol.ro

Modificările acestor termeni vor fi comunicate cu 30 de zile înainte de intrarea în vigoare.

Ultima actualizare: ${new Date().toLocaleDateString("ro-RO")}`
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Termeni și Condiții</h1>
        <p className="text-subink mt-2">
          Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Table of Contents - Desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <h2 className="font-semibold text-ink mb-4">Cuprins</h2>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-micro ${
                    openSections.includes(section.id)
                      ? "bg-primary text-white"
                      : "text-subink hover:bg-bg-soft"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-line bg-white">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-bg-soft transition-micro"
                >
                  <h3 className="font-medium text-ink">{section.title}</h3>
                  {openSections.includes(section.id) ? (
                    <ChevronDown className="h-5 w-5 text-muted" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted" />
                  )}
                </button>
                
                {openSections.includes(section.id) && (
                  <div className="px-6 pb-6">
                    <div className="prose prose-sm max-w-none text-subink leading-relaxed">
                      {section.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl border border-line bg-bg-soft">
            <h3 className="font-medium text-ink mb-2">Ai întrebări?</h3>
            <p className="text-sm text-subink mb-4">
              Pentru clarificări suplimentare sau dispute legate de acești termeni, 
              contactează echipa noastră juridică.
            </p>
            <a 
              href="mailto:legal@floristmarket.ro"
              className="btn-outline"
            >
              Contactează echipa juridică
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
