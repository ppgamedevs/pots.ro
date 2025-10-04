import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Cookie-uri - Pots.ro",
  description: "Informații despre cookie-urile folosite pe Pots.ro și cum să îți gestionezi preferințele.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Politica de Cookie-uri
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ultima actualizare:</strong> 15 Decembrie 2024
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Această pagină explică ce sunt cookie-urile, cum le folosim pe site-ul Pots.ro 
              și cum poți gestiona preferințele tale privind cookie-urile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Ce sunt cookie-urile?
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Cookie-urile sunt fișiere text mici care sunt plasate pe dispozitivul tău când 
              vizitezi un site web. Ele sunt utilizate pe scară largă pentru a face site-urile 
              să funcționeze mai eficient, precum și pentru a furniza informații proprietarilor site-ului.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Tipuri de cookie-uri
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li><strong>Cookie-uri de sesiune:</strong> Se șterg când închizi browserul</li>
                <li><strong>Cookie-uri persistente:</strong> Rămân pe dispozitiv pentru o perioadă determinată</li>
                <li><strong>Cookie-uri first-party:</strong> Plasate de site-ul pe care îl vizitezi</li>
                <li><strong>Cookie-uri third-party:</strong> Plasate de alte site-uri (ex: Google Analytics)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Cum folosim cookie-urile
            </h2>
            
            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Cookie-uri necesare
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Aceste cookie-uri sunt esențiale pentru funcționarea site-ului și nu pot fi dezactivate.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Exemple de utilizare:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <li>Păstrarea sesiunii de autentificare</li>
                    <li>Coșul de cumpărături</li>
                    <li>Preferințele de limbă și regiune</li>
                    <li>Securitatea site-ului</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Cookie-uri de analiză
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Ne ajută să înțelegem cum interacționezi cu site-ul pentru a-l îmbunătăți.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Servicii folosite:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <li><strong>Google Analytics:</strong> Analiza traficului și comportamentului utilizatorilor</li>
                    <li><strong>Hotjar:</strong> Heatmaps și înregistrări de sesiuni</li>
                    <li><strong>Mixpanel:</strong> Analiza evenimentelor și conversiilor</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Cookie-uri de marketing
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Folosite pentru a personaliza reclamele și a măsura eficiența campaniilor.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Servicii folosite:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <li><strong>Facebook Pixel:</strong> Urmărirea conversiilor și retargeting</li>
                    <li><strong>Google Ads:</strong> Măsurarea eficienței campaniilor publicitare</li>
                    <li><strong>LinkedIn Insight Tag:</strong> Analiza audienței și conversiilor</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Cookie-uri funcționale
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  Permit funcționalități avansate și personalizare a experienței utilizatorului.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Exemple de utilizare:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <li>Preferințele de afișare (tema întunecată/deschisă)</li>
                    <li>Setările de notificări</li>
                    <li>Preferințele de filtrare și sortare</li>
                    <li>Funcționalități de chat live</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Durata păstrării cookie-urilor
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 dark:border-slate-700 rounded-lg">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Tip cookie
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Durata
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Descriere
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Sesiune
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Până la închiderea browserului
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Autentificare, coș de cumpărături
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Preferințe
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      1 an
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Setări de afișare, limbă
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Analiză
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      2 ani
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Google Analytics, tracking
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Marketing
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      90 zile
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Facebook Pixel, retargeting
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Cum să îți gestionezi cookie-urile
            </h2>
            
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Pe site-ul nostru
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Poți gestiona preferințele cookie-urilor folosind banner-ul de consimțământ 
                  sau accesând setările din footer-ul site-ului.
                </p>
                <button className="btn btn-primary">
                  Gestionează preferințele
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  În browser
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Majoritatea browserelor îți permit să controlezi cookie-urile prin setările de confidențialitate.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Chrome
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Setări → Confidențialitate și securitate → Cookie-uri
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Firefox
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Opțiuni → Confidențialitate și securitate → Cookie-uri
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Safari
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Preferințe → Confidențialitate → Cookie-uri
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Edge
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Setări → Cookie-uri și permisiuni site
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Cookie-uri third-party
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Site-ul nostru poate conține linkuri către alte site-uri care au propriile 
              politici de cookie-uri. Nu suntem responsabili pentru conținutul sau 
              politicile de confidențialitate ale acestor site-uri.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ⚠️ Important
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Dezactivarea anumitor cookie-uri poate afecta funcționalitatea site-ului 
                și experiența ta de navigare. Cookie-urile necesare nu pot fi dezactivate 
                fără a afecta funcționarea de bază a site-ului.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Modificări ale politicii
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300">
              Ne rezervăm dreptul de a modifica această politică de cookie-uri în orice moment. 
              Orice modificări vor fi publicate pe această pagină cu o nouă dată de actualizare. 
              Te încurajăm să consulți această pagină periodic pentru a fi la curent cu orice modificări.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Contact
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Dacă ai întrebări despre această politică de cookie-uri sau despre modul în care 
                folosim cookie-urile, contactează-ne:
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Email:</strong> privacy@floristmarket.ro<br />
                <strong>Telefon:</strong> +40 721 123 456<br />
                <strong>Adresă:</strong> Str. Exemplu 123, București, România
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
