"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Shield, Eye, Database, Users, Lock } from "lucide-react";

export default function PrivacyPage() {
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
      id: "what-we-collect",
      title: "Ce date colectăm",
      icon: <Database className="h-5 w-5" />,
      content: `Datele personale pe care le colectăm includ:

Date de identificare:
- Nume complet
- Adresă de email
- Număr de telefon
- Adresă de livrare și facturare
- Data nașterii (opțional)

Date financiare:
- Informații de plată (procesate prin Netopia)
- Istoricul comenzilor
- Facturi și chitanțe

Date tehnice:
- Adresa IP
- Tipul de browser și dispozitiv
- Paginile vizitate și timpul petrecut
- Cookie-uri și tehnologii similare

Date de utilizare:
- Produsele căutate și vizualizate
- Preferințele de căutare
- Interacțiunile cu platforma`
    },
    {
      id: "why-we-collect",
      title: "De ce colectăm aceste date",
      icon: <Eye className="h-5 w-5" />,
      content: `Colectăm datele pentru următoarele scopuri:

Procesarea comenzilor:
- Validarea și procesarea comenzilor
- Livrarea produselor
- Gestionarea retururilor și garanțiilor
- Comunicarea despre statusul comenzii

Îmbunătățirea serviciilor:
- Personalizarea experienței de cumpărare
- Recomandarea produselor relevante
- Optimizarea interfeței și funcționalităților
- Analiza comportamentului utilizatorilor

Comunicarea:
- Trimiterea de notificări despre comenzi
- Newsletter și oferte personalizate
- Suport tehnic și customer service
- Informări despre modificări ale serviciilor

Conformitate legală:
- Respectarea obligațiilor fiscale
- Gestionarea disputelor și reclamațiilor
- Protecția împotriva fraudelor
- Respectarea legislației aplicabile`
    },
    {
      id: "legal-basis",
      title: "Temeiul legal pentru procesare",
      icon: <Shield className="h-5 w-5" />,
      content: `Procesarea datelor se bazează pe următoarele temeiuri legale:

Execuția contractului (Art. 6(1)(b) GDPR):
- Procesarea comenzilor și livrarea produselor
- Gestionarea contului de utilizator
- Suportul tehnic și customer service

Interesul legitim (Art. 6(1)(f) GDPR):
- Îmbunătățirea serviciilor și platformei
- Analiza comportamentului utilizatorilor
- Prevenirea fraudelor și securitatea
- Marketing direct și comunicări comerciale

Consimțământul (Art. 6(1)(a) GDPR):
- Newsletter și comunicări de marketing
- Cookie-uri non-esențiale
- Procesarea datelor sensibile (când aplicabil)

Obligația legală (Art. 6(1)(c) GDPR):
- Păstrarea facturilor și documentelor contabile
- Raportarea către autoritățile fiscale
- Respectarea cerințelor de securitate`
    },
    {
      id: "retention",
      title: "Perioada de păstrare",
      icon: <Lock className="h-5 w-5" />,
      content: `Păstrăm datele pentru următoarele perioade:

Date de cont:
- Până la ștergerea contului sau 3 ani de inactivitate
- Datele de identificare: 5 ani după ultima activitate

Date comerciale:
- Facturi și chitanțe: 10 ani (conform legislației fiscale)
- Istoricul comenzilor: 5 ani
- Comunicările cu suportul: 3 ani

Date tehnice:
- Log-uri de securitate: 1 an
- Cookie-uri: conform politicii de cookie-uri
- Date de analiză: 2 ani (anonimizate)

Date de marketing:
- Până la retragerea consimțământului
- Newsletter: până la dezabonare
- Profilul de preferințe: până la ștergerea contului

După expirarea perioadei de păstrare, datele sunt șterse în siguranță sau anonimizate.`
    },
    {
      id: "sharing",
      title: "Partajarea datelor",
      icon: <Users className="h-5 w-5" />,
      content: `Partajăm datele cu următoarele categorii de destinatari:

Vânzători:
- Datele necesare pentru procesarea și livrarea comenzilor
- Informații de contact pentru comunicarea despre comenzi
- Nu partajăm datele pentru marketing direct

Procesatori de plăți:
- Netopia pentru procesarea plăților
- Datele financiare sunt procesate conform standardelor PCI DSS
- Nu avem acces la datele complete de plată

Curieri și servicii de livrare:
- Datele de livrare pentru livrarea comenzilor
- Informații de contact pentru comunicarea despre livrare
- Tracking-ul comenzilor

Servicii de analiză:
- Google Analytics (date anonimizate)
- Servicii de email marketing (cu consimțământ)
- Servicii de suport tehnic

Autorități:
- Doar când este cerut prin lege
- Pentru investigații de securitate
- Conform cerințelor fiscale și legale

Nu vindem datele personale către terți pentru scopuri comerciale.`
    },
    {
      id: "rights",
      title: "Drepturile tale",
      icon: <Shield className="h-5 w-5" />,
      content: `Conform GDPR, ai următoarele drepturi:

Dreptul de acces (Art. 15 GDPR):
- Să primești o copie a datelor tale personale
- Să știi cum sunt procesate datele
- Să primești informații despre destinatari

Dreptul la rectificare (Art. 16 GDPR):
- Să corectezi datele inexacte sau incomplete
- Să actualizezi informațiile din contul tău
- Să modifici preferințele de comunicare

Dreptul la ștergere (Art. 17 GDPR):
- Să ceri ștergerea datelor când nu mai sunt necesare
- Să retragi consimțământul pentru procesare
- Să ștergi contul și toate datele asociate

Dreptul la portabilitate (Art. 20 GDPR):
- Să primești datele într-un format structurat
- Să transferi datele către alt furnizor de servicii
- Să obții o copie în format JSON sau CSV

Dreptul la opoziție (Art. 21 GDPR):
- Să te opui procesării pentru marketing direct
- Să ceri oprirea procesării bazate pe interes legitim
- Să dezabonezi de la newsletter

Pentru exercitarea acestor drepturi, contactează-ne la privacy@floristmarket.ro`
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Politica de confidențialitate</h1>
        <p className="text-subink mt-2">
          Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
        </p>
      </div>

      <div className="mb-8 p-6 rounded-xl border border-line bg-bg-soft">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-ink mb-2">Protecția datelor tale este importantă pentru noi</h2>
            <p className="text-sm text-subink leading-relaxed">
              Această politică explică cum colectăm, folosim și protejăm informațiile tale personale 
              când folosești FloristMarket.ro. Respectăm drepturile tale și ne angajăm să procesăm 
              datele în conformitate cu GDPR și legislația română aplicabilă.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-line bg-white">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-bg-soft transition-micro"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded text-primary">
                  {section.icon}
                </div>
                <h3 className="font-medium text-ink">{section.title}</h3>
              </div>
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

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-line bg-bg-soft">
          <h3 className="font-medium text-ink mb-2">Contact pentru confidențialitate</h3>
          <p className="text-sm text-subink mb-4">
            Pentru întrebări despre procesarea datelor sau exercitarea drepturilor tale.
          </p>
          <a 
            href="mailto:privacy@floristmarket.ro"
            className="btn-outline"
          >
            Contactează echipa de confidențialitate
          </a>
        </div>

        <div className="p-6 rounded-xl border border-line bg-bg-soft">
          <h3 className="font-medium text-ink mb-2">Cereri GDPR</h3>
          <p className="text-sm text-subink mb-4">
            Pentru ștergerea contului sau exportul datelor, folosește formularul dedicat.
          </p>
          <a 
            href="/gdpr"
            className="btn-primary"
          >
            Accesează formularul GDPR
          </a>
        </div>
      </div>
    </div>
  );
}
