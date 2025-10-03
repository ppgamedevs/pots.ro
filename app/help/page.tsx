import { Metadata } from "next";
import { Search, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center - Pots.ro",
  description: "Centrul de ajutor Pots.ro - găsește răspunsuri la întrebările tale despre platformă.",
};

export default function HelpPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Help Center
        </h1>
        
        <div className="space-y-12">
          {/* Search Section */}
          <section className="text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Cum te putem ajuta?
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Caută în articolele de ajutor..."
                  className="w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          {/* Quick Help Categories */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Categorii de ajutor
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <HelpCircle className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Începe aici
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Ghiduri de bază pentru a începe să folosești platforma
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Cum să îți creezi cont</li>
                  <li>• Cum să plasezi o comandă</li>
                  <li>• Cum să devii vânzător</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <MessageCircle className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Comenzi și livrare
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Totul despre plasarea și urmărirea comenzilor
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Urmărirea comenzii</li>
                  <li>• Modificarea comenzii</li>
                  <li>• Probleme cu livrarea</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <Phone className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Plăți și facturare
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Informații despre metodele de plată și facturare
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Metode de plată acceptate</li>
                  <li>• Probleme cu plata</li>
                  <li>• Facturi și chitanțe</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <Mail className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Retururi și schimburi
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Ghiduri pentru returnarea sau schimbarea produselor
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Politica de retur</li>
                  <li>• Cum să returnezi un produs</li>
                  <li>• Schimbarea produselor</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <HelpCircle className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Contul meu
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Gestionarea contului și setărilor personale
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Modificarea datelor personale</li>
                  <li>• Schimbarea parolei</li>
                  <li>• Istoricul comenzilor</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
                <MessageCircle className="h-8 w-8 text-brand mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Vânzători
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Ghiduri pentru vânzători și gestionarea magazinului
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Configurarea magazinului</li>
                  <li>• Adăugarea produselor</li>
                  <li>• Gestionarea comenzilor</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Popular Articles */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Articole populare
            </h2>
            
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Cum să plasez o comandă pe Pots.ro?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Ghid pas cu pas pentru plasarea primei comenzi pe platforma noastră.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Actualizat acum 2 zile
                  </span>
                  <button className="text-brand hover:underline text-sm font-medium">
                    Citește articolul →
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Ce metode de plată acceptați?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Lista completă a metodelor de plată acceptate și cum să le folosești.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Actualizat acum 1 săptămână
                  </span>
                  <button className="text-brand hover:underline text-sm font-medium">
                    Citește articolul →
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Cum să returnez un produs?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Procesul complet de returnare a produselor și condițiile aplicabile.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Actualizat acum 3 zile
                  </span>
                  <button className="text-brand hover:underline text-sm font-medium">
                    Citește articolul →
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Cum să devin vânzător pe platformă?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Ghid complet pentru înregistrarea ca vânzător și configurarea magazinului.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Actualizat acum 1 săptămână
                  </span>
                  <button className="text-brand hover:underline text-sm font-medium">
                    Citește articolul →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-slate-50 dark:bg-slate-800 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Nu găsești răspunsul?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Echipa noastră de suport este aici să te ajute. Contactează-ne prin oricare dintre metodele de mai jos.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Phone className="h-8 w-8 text-brand mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Telefon
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  +40 721 123 456
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Luni - Vineri: 9:00 - 18:00
                </p>
              </div>

              <div className="text-center">
                <Mail className="h-8 w-8 text-brand mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Email
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  support@floristmarket.ro
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Răspundem în 24 de ore
                </p>
              </div>

              <div className="text-center">
                <MessageCircle className="h-8 w-8 text-brand mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Chat live
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Disponibil acum
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Luni - Vineri: 9:00 - 18:00
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <a href="/contact" className="btn btn-primary">
                Contactează-ne acum
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
