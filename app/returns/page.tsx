import { Metadata } from "next";
import { ArrowLeft, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de retur - Pots.ro",
  description: "Informații despre returnarea produselor, condiții și procesul de retur pe Pots.ro.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Politica de retur
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ultima actualizare:</strong> 15 Decembrie 2024
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Această politică de retur reglementează condițiile și procesul de returnare 
              a produselor cumpărate prin platforma Pots.ro.
            </p>
          </section>

          {/* Key Information */}
          <section className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Dreptul de retur
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Ai dreptul de a returna produsele în termen de <strong>14 zile calendaristice</strong> de la primirea acestora, 
                  fără a fi nevoie să motivezi decizia, conform legislației române și europene.
                </p>
              </div>
            </div>
          </section>

          {/* Return Conditions */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Condiții pentru retur
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  ✅ Produse care pot fi returnate
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    Produse în starea originală, nevăzute
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    Etichetele și ambalajul intacte
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    Produsele nu au fost folosite
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    Toate accesoriile și documentația incluse
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  ❌ Produse care NU pot fi returnate
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    Produse personalizate sau făcute la comandă
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    Produse perisabile (plante, flori)
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    Produse deteriorate din vina cumpărătorului
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    Produse cu etichete îndepărtate
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Return Process */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Procesul de retur
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Contactează vânzătorul
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Trimite un mesaj vânzătorului prin platformă sau contactează-ne la{" "}
                    <a href="mailto:returns@pots.ro" className="text-brand hover:underline">
                      returns@pots.ro
                    </a>{" "}
                    pentru a iniția procesul de retur.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Completează formularul de retur
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Vei primi un formular de retur care trebuie completat cu motivele returnării 
                    și informațiile necesare pentru procesare.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Împachetează produsele
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Folosește ambalajul original sau un ambalaj similar pentru a proteja produsele 
                    în timpul transportului. Include toate accesoriile și documentația.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Trimite produsele
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Trimite produsele la adresa indicată în formularul de retur. 
                    Păstrează chitanța de expediere ca dovadă.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Primești rambursarea
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    După verificarea produselor, vei primi rambursarea în termen de 14 zile 
                    prin aceeași metodă de plată folosită la comandă.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Costs and Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Costuri și rambursări
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Costurile de retur
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• <strong>Retur din vina cumpărătorului:</strong> Costurile sunt suportate de cumpărător</li>
                  <li>• <strong>Produs defect sau necorespunzător:</strong> Costurile sunt suportate de vânzător</li>
                  <li>• <strong>Eroare de livrare:</strong> Costurile sunt suportate de Pots.ro</li>
                  <li>• <strong>Retur în termen de 14 zile:</strong> Costurile sunt suportate de cumpărător</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Rambursările
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• <strong>Metoda de rambursare:</strong> Aceeași ca la comandă</li>
                  <li>• <strong>Termenul:</strong> 14 zile de la primirea produsului</li>
                  <li>• <strong>Valoarea:</strong> Prețul produsului (fără costurile de livrare)</li>
                  <li>• <strong>Costurile de retur:</strong> Deduse din rambursare (dacă aplicabil)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Special Cases */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Cazuri speciale
            </h2>
            
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Produse defecte sau deteriorate
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Dacă produsul ajunge defect sau deteriorat, contactează-ne imediat. 
                  Vom organiza înlocuirea sau rambursarea completă, inclusiv costurile de transport.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Produse care nu corespund descrierii
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Dacă produsul nu corespunde descrierii sau imaginilor, poți returna 
                  produsul fără costuri suplimentare în termen de 30 de zile.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Retururi pentru comenzi mari
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Pentru comenzi peste 500 RON, oferim serviciu de ridicare gratuită 
                  pentru retururi. Contactează-ne pentru a organiza ridicarea.
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Cronologia procesului
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div>
                  <Clock className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Ziua 1
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Solicitarea returului
                  </p>
                </div>
                <div>
                  <Package className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Ziua 2-3
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Expedierea produselor
                  </p>
                </div>
                <div>
                  <CheckCircle className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Ziua 5-7
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Verificarea produselor
                  </p>
                </div>
                <div>
                  <ArrowLeft className="h-8 w-8 text-brand mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Ziua 14
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Rambursarea
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-slate-50 dark:bg-slate-800 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Ai întrebări despre retururi?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Echipa noastră de suport este aici să te ajute cu orice întrebare despre procesul de retur.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:returns@pots.ro" className="btn btn-primary">
                Email retururi
              </a>
              <a href="/contact" className="btn btn-ghost">
                Contactează-ne
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
