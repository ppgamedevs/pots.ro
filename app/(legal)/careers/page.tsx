import { Metadata } from "next";
import { Users, Heart, Zap, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Cariere - Pots.ro",
  description: "Alătură-te echipei Pots.ro și ajută-ne să construim viitorul e-commerce-ului pentru produse de floristică.",
};

export default function CareersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Cariere
        </h1>
        
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Construiește viitorul cu noi
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Căutăm oameni pasionați de tehnologie și natură care să ne ajute să construim 
              cea mai bună platformă de e-commerce pentru produsele de floristică din România.
            </p>
          </section>

          {/* Why Work With Us */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              De ce să lucrezi cu noi?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Users className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Echipă tânără
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Colaborează cu o echipă dinamică și inovatoare
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Heart className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Impact pozitiv
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Contribuie la sustenabilitate și comunitate locală
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Zap className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Tehnologie modernă
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Lucrează cu cele mai noi tehnologii web
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Globe className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Work-life balance
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Program flexibil și lucru remote
                </p>
              </div>
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Poziții deschise
            </h2>
            
            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Frontend Developer
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      React, Next.js, TypeScript
                    </p>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                    Full-time
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Căutăm un dezvoltator frontend pasionat să ne ajute să construim 
                  interfața utilizator pentru platforma noastră de e-commerce.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    React
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Next.js
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    TypeScript
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Tailwind CSS
                  </span>
                </div>
                <button className="btn btn-primary">
                  Aplică acum
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Backend Developer
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Node.js, PostgreSQL, AWS
                    </p>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                    Full-time
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Căutăm un dezvoltator backend să ne ajute să construim API-urile 
                  și infrastructura pentru platforma noastră.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Node.js
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    PostgreSQL
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    AWS
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Docker
                  </span>
                </div>
                <button className="btn btn-primary">
                  Aplică acum
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Marketing Specialist
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Digital Marketing, Social Media
                    </p>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                    Part-time
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Căutăm un specialist în marketing digital să ne ajute să construim 
                  prezența online și să atragem noi clienți.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Google Ads
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Facebook Ads
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    Content Marketing
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                    SEO
                  </span>
                </div>
                <button className="btn btn-primary">
                  Aplică acum
                </button>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Beneficii
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Beneficii financiare
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Salariu competitiv</li>
                  <li>• Bonusuri pe performanță</li>
                  <li>• Acțiuni în companie</li>
                  <li>• Buget pentru training și conferințe</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Beneficii non-financiare
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Program flexibil</li>
                  <li>• Lucru remote</li>
                  <li>• Echipament de lucru modern</li>
                  <li>• Mediu de lucru relaxat</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Application Process */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Procesul de aplicare
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Aplică
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Completează formularul de aplicare
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Screening
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Revizuim CV-ul și portofoliul
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Interviu
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Discuție cu echipa tehnică
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Ofertă
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Primim răspunsul final
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-slate-50 dark:bg-slate-800 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Nu găsești poziția potrivită?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Trimite-ne CV-ul tău și te vom contacta când avem o poziție potrivită pentru tine.
            </p>
            <button className="btn btn-primary">
              Trimite CV-ul
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
