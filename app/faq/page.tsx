import { Metadata } from "next";
import { ChevronDown, ChevronUp } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ - Întrebări frecvente - Pots.ro",
  description: "Răspunsuri la cele mai frecvente întrebări despre Pots.ro, comenzi, livrare, plăți și retururi.",
};

export default function FAQPage() {
  const faqData = [
    {
      category: "Comenzi și livrare",
      questions: [
        {
          question: "Cum plasez o comandă?",
          answer: "Pentru a plasa o comandă, adaugă produsele dorite în coș, apoi urmează pașii de checkout. Vei fi ghidat prin procesul de plată și confirmare."
        },
        {
          question: "Cât durează livrarea?",
          answer: "Livrarea standard durează 2-5 zile lucrătoare în toată țara. Pentru București, livrarea poate fi efectuată în aceeași zi pentru comenzile plasate înainte de ora 14:00."
        },
        {
          question: "Pot modifica comanda după ce am plasat-o?",
          answer: "Da, poți modifica comanda în termen de 30 de minute de la plasarea acesteia, dacă încă nu a fost procesată pentru livrare. Contactează-ne pentru asistență."
        },
        {
          question: "Cum urmăresc comanda mea?",
          answer: "Primești un email de confirmare cu numărul de urmărire. Poți verifica statusul comenzii în contul tău sau folosind link-ul din email."
        }
      ]
    },
    {
      category: "Plăți și facturare",
      questions: [
        {
          question: "Ce metode de plată acceptați?",
          answer: "Acceptăm carduri de credit/debit (Visa, Mastercard), plăți online prin procesatori securizați, ramburs la livrare (pentru anumite produse) și transfer bancar pentru comenzi mari."
        },
        {
          question: "Plățile sunt sigure?",
          answer: "Da, toate plățile sunt procesate prin sisteme securizate și criptate. Nu stocăm informațiile despre cardurile de credit ale clienților."
        },
        {
          question: "Pot plăti cu cardul de credit?",
          answer: "Da, acceptăm toate cardurile de credit și debit major (Visa, Mastercard, American Express). Plățile sunt procesate instant și securizat."
        },
        {
          question: "Când se debitează cardul?",
          answer: "Cardul este debitat imediat după confirmarea comenzii. Dacă comanda este anulată, banii sunt returnați în termen de 3-5 zile lucrătoare."
        }
      ]
    },
    {
      category: "Retururi și schimburi",
      questions: [
        {
          question: "Pot returna produsele?",
          answer: "Da, ai dreptul de retur în 14 zile de la primirea produsului. Produsele trebuie să fie în starea originală, cu etichetele și ambalajul intact."
        },
        {
          question: "Cum returnez un produs?",
          answer: "Contactează vânzătorul prin platformă, completează formularul de retur, împachetează produsele în ambalajul original și trimite-le la adresa indicată. Vei primi rambursarea în termen de 14 zile."
        },
        {
          question: "Cine plătește costurile de retur?",
          answer: "Costurile de retur sunt suportate de cumpărător, cu excepția cazurilor în care produsul este defect sau nu corespunde descrierii. În aceste situații, costurile sunt suportate de vânzător."
        },
        {
          question: "Când primesc banii înapoi?",
          answer: "Rambursarea se face în termen de 14 zile de la primirea produsului returnat. Banii sunt returnați prin aceeași metodă de plată folosită la comandă."
        }
      ]
    },
    {
      category: "Contul meu",
      questions: [
        {
          question: "Cum îmi creez cont?",
          answer: "Apasă pe 'Înregistrare' din meniul principal, completează formularul cu datele tale și confirmă email-ul. Procesul durează doar câteva minute."
        },
        {
          question: "Am uitat parola. Ce fac?",
          answer: "Apasă pe 'Am uitat parola' la pagina de login, introdu email-ul tău și vei primi instrucțiuni pentru resetarea parolei."
        },
        {
          question: "Pot modifica datele din cont?",
          answer: "Da, poți modifica datele personale, adresa de livrare și preferințele din secțiunea 'Contul meu' din meniul principal."
        },
        {
          question: "Cum șterg contul?",
          answer: "Contactează-ne la support@pots.ro pentru a solicita ștergerea contului. Procesul se finalizează în termen de 30 de zile."
        }
      ]
    },
    {
      category: "Vânzători",
      questions: [
        {
          question: "Cum devin vânzător pe platformă?",
          answer: "Completează formularul de înregistrare ca vânzător, furnizează documentele necesare și așteaptă aprobarea. Procesul durează 2-3 zile lucrătoare."
        },
        {
          question: "Ce comisioane percepeți?",
          answer: "Comisioanele variază în funcție de categoria produsului și volumul de vânzări, între 5-15%. Detaliile exacte sunt furnizate la înregistrare."
        },
        {
          question: "Când primesc banii din vânzări?",
          answer: "Plățile se fac lunar, în a doua săptămână a lunii următoare. Primești un raport detaliat cu toate vânzările și comisioanele."
        },
        {
          question: "Pot gestiona stocurile?",
          answer: "Da, ai acces la un panou de control complet unde poți gestiona produsele, stocurile, comenzile și rapoartele de vânzări."
        }
      ]
    },
    {
      category: "Probleme tehnice",
      questions: [
        {
          question: "Site-ul nu se încarcă. Ce fac?",
          answer: "Încearcă să reîmprospătezi pagina (F5) sau să ștergi cache-ul browserului. Dacă problema persistă, contactează-ne la support@pots.ro."
        },
        {
          question: "Nu primesc email-urile de confirmare",
          answer: "Verifică folderul de spam/junk. Dacă nu găsești email-urile, contactează-ne și le vom retrimite manual."
        },
        {
          question: "Aplicația mobile funcționează?",
          answer: "Momentan nu avem aplicație mobile dedicată, dar site-ul este optimizat pentru mobile și funcționează perfect pe toate dispozitivele."
        },
        {
          question: "Pot folosi site-ul fără JavaScript?",
          answer: "Site-ul necesită JavaScript pentru funcționalități avansate. Pentru o experiență optimă, asigură-te că JavaScript este activat în browser."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Întrebări frecvente
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Găsește răspunsuri rapide la cele mai frecvente întrebări despre platforma Pots.ro. 
              Dacă nu găsești răspunsul căutat, contactează-ne la{" "}
              <a href="mailto:support@pots.ro" className="text-brand hover:underline">
                support@pots.ro
              </a>.
            </p>
          </section>

          {/* FAQ Categories */}
          {faqData.map((category, categoryIndex) => (
            <section key={categoryIndex}>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                    <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </button>
                    <div className="px-6 pb-4">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Contact Section */}
          <section className="bg-slate-50 dark:bg-slate-800 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Nu găsești răspunsul?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Echipa noastră de suport este aici să te ajute. Contactează-ne prin oricare dintre metodele de mai jos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@pots.ro" className="btn btn-primary">
                Trimite email
              </a>
              <a href="/contact" className="btn btn-ghost">
                Pagina de contact
              </a>
              <a href="tel:+40721123456" className="btn btn-ghost">
                Sună acum
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
