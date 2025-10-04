import { Metadata } from "next";
import { Download, Mail, Calendar, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Presa - Pots.ro",
  description: "Resurse pentru presă, comunicate de presă și materiale media despre Pots.ro.",
};

export default function PressPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Presa
        </h1>
        
        <div className="space-y-12">
          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Contact presă
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Contact principal
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-1">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:press@floristmarket.ro" className="text-brand hover:underline">
                      press@floristmarket.ro
                    </a>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mb-1">
                    <strong>Telefon:</strong> +40 721 123 456
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Răspuns:</strong> În 24 de ore
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Contact urgent
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-1">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:urgent@floristmarket.ro" className="text-brand hover:underline">
                      urgent@floristmarket.ro
                    </a>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Telefon:</strong> +40 721 123 457
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Press Kit */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Press Kit
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-brand" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Logo-uri și brand assets
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Logo-uri în diferite formate (PNG, SVG, PDF) și ghidul de brand 
                  cu regulile de utilizare.
                </p>
                <button className="btn btn-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă ZIP
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-brand" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Imagini de produse
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Imagini de înaltă calitate cu produsele noastre pentru 
                  articole și materiale de presă.
                </p>
                <button className="btn btn-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă ZIP
                </button>
              </div>
            </div>
          </section>

          {/* Recent Press Releases */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Comunicate de presă recente
            </h2>
            
            <div className="space-y-6">
              <article className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Pots.ro lansează platforma de e-commerce pentru produse de floristică
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        15 Decembrie 2024
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Pots.ro, primul marketplace românesc dedicat exclusiv produselor de floristică 
                  și grădinărit, a fost lansat oficial astăzi. Platforma conectează producătorii 
                  locali cu clienții care apreciază calitatea și autenticitatea produselor handmade.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-ghost">
                    Citește complet
                  </button>
                  <button className="btn btn-primary">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă PDF
                  </button>
                </div>
              </article>

              <article className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Pots.ro obține finanțare de 500.000 EUR pentru dezvoltare
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        10 Decembrie 2024
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Pots.ro a anunțat astăzi că a obținut o rundă de finanțare de 500.000 EUR 
                  de la investitori locali. Fondurile vor fi utilizate pentru dezvoltarea 
                  platformei și extinderea echipei.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-ghost">
                    Citește complet
                  </button>
                  <button className="btn btn-primary">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă PDF
                  </button>
                </div>
              </article>

              <article className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Parteneriat cu Asociația Producătorilor de Ceramică
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        5 Decembrie 2024
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Pots.ro a semnat un parteneriat strategic cu Asociația Producătorilor de 
                  Ceramică din România pentru a promova și susține producătorii locali de 
                  ceramică artistică.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-ghost">
                    Citește complet
                  </button>
                  <button className="btn btn-primary">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă PDF
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* Media Coverage */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Mențiuni în presă
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  "Pots.ro - viitorul e-commerce-ului pentru grădinărit"
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <strong>TechCrunch România</strong> - 12 Decembrie 2024
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  "Platforma Pots.ro reprezintă o inovație în ecosistemul e-commerce românesc, 
                  concentrându-se exclusiv pe produsele de floristică și grădinărit."
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  "Startup-ul care vrea să revoluționeze grădinăritul"
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Startup.ro</strong> - 8 Decembrie 2024
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  "Pots.ro a identificat o nișă neexploatată în piața românească și construiește 
                  o platformă dedicată exclusiv producătorilor de ceramică și accesorii de grădinărit."
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  "Sustenabilitate și tehnologie în grădinărit"
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Green Business</strong> - 3 Decembrie 2024
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  "Pots.ro promovează produse eco-friendly și susține producătorii locali, 
                  contribuind la dezvoltarea durabilă a comunității."
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  "E-commerce-ul care conectează pasiunea cu tehnologia"
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Digital Business</strong> - 1 Decembrie 2024
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  "Pots.ro demonstrează că tehnologia poate fi folosită pentru a conecta 
                  pasiuni tradiționale cu nevoile moderne ale consumatorilor."
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center bg-slate-50 dark:bg-slate-800 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Ai întrebări pentru presă?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Contactează-ne pentru informații suplimentare, interviuri sau materiale media.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:press@floristmarket.ro" className="btn btn-primary">
                <Mail className="h-4 w-4 mr-2" />
                Contactează presa
              </a>
              <a href="/contact" className="btn btn-ghost">
                Pagina de contact
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
