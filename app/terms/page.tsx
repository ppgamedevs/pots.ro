import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții - Pots.ro",
  description: "Termenii și condițiile de utilizare a platformei Pots.ro.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Termeni și condiții
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ultima actualizare:</strong> 15 Decembrie 2024
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Acești termeni și condiții reglementează utilizarea platformei Pots.ro. 
              Prin accesarea și utilizarea site-ului nostru, accepti acești termeni în totalitate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              1. Definiții
            </h2>
            
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                <strong>"Platforma"</strong> se referă la site-ul web Pots.ro și toate serviciile oferite prin intermediul acestuia.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>"Utilizator"</strong> este orice persoană care accesează sau utilizează platforma.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>"Vânzător"</strong> este un utilizator care vinde produse prin intermediul platformei.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>"Cumpărător"</strong> este un utilizator care cumpără produse prin intermediul platformei.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>"Produse"</strong> sunt articolele de floristică, grădinărit și decor vândute prin platformă.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              2. Acceptarea termenilor
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Prin accesarea, navigarea sau utilizarea platformei Pots.ro, confirmi că:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Ai citit și înțeles acești termeni și condiții</li>
              <li>Accepti să fii obligat de acești termeni</li>
              <li>Ai vârsta legală de 18 ani sau ai consimțământul părinților/tutorilor</li>
              <li>Ai capacitatea legală de a încheia contracte</li>
              <li>Informațiile furnizate sunt adevărate și complete</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              3. Descrierea serviciilor
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Pots.ro este o platformă de e-commerce care permite:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Pentru cumpărători
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Navigarea și căutarea produselor</li>
                  <li>Plasarea comenzilor online</li>
                  <li>Plata securizată a produselor</li>
                  <li>Urmărirea comenzilor</li>
                  <li>Evaluarea și recenzierea produselor</li>
                  <li>Returnarea produselor conform politicii</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Pentru vânzători
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Înregistrarea ca vânzător</li>
                  <li>Adăugarea și gestionarea produselor</li>
                  <li>Gestionarea comenzilor</li>
                  <li>Accesarea rapoartelor de vânzări</li>
                  <li>Comunicarea cu clienții</li>
                  <li>Gestionarea stocurilor</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              4. Obligațiile utilizatorilor
            </h2>
            
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              4.1 Obligații generale
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Respectarea legislației române și internaționale aplicabile</li>
              <li>Furnizarea de informații adevărate și complete</li>
              <li>Păstrarea confidențialității contului și parolei</li>
              <li>Notificarea imediată a oricărei utilizări neautorizate a contului</li>
              <li>Respectarea drepturilor de proprietate intelectuală</li>
              <li>Neutilizarea platformei pentru activități ilegale sau frauduloase</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-6">
              4.2 Obligații specifice vânzătorilor
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Furnizarea de produse conform descrierilor și imaginilor</li>
              <li>Respectarea termenilor de livrare anunțați</li>
              <li>Gestionarea corectă a stocurilor</li>
              <li>Răspunderea la întrebările clienților în timp util</li>
              <li>Respectarea politicii de retur</li>
              <li>Plata comisioanelor și taxelor convenite</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              5. Prețuri și plăți
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Prețurile produselor
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Toate prețurile sunt afișate în RON și includ TVA-ul</li>
                  <li>Prețurile pot fi modificate de vânzători în orice moment</li>
                  <li>Prețurile finale includ taxele de livrare (dacă sunt aplicabile)</li>
                  <li>Pots.ro nu controlează prețurile stabilite de vânzători</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Metode de plată
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Carduri de credit/debit (Visa, Mastercard)</li>
                  <li>Plăți online prin procesatori securizați</li>
                  <li>Ramburs la livrare (pentru anumite produse)</li>
                  <li>Transfer bancar (pentru comenzi mari)</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Securitatea plăților
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Toate plățile sunt procesate prin sisteme securizate și criptate. 
                  Nu stocăm informațiile despre cardurile de credit ale clienților.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              6. Livrarea produselor
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Termene de livrare
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Livrarea standard: 2-5 zile lucrătoare</li>
                  <li>Livrarea express: 1-2 zile lucrătoare (pentru anumite produse)</li>
                  <li>Livrarea în București: poate fi în aceeași zi pentru comenzile plasate înainte de ora 14:00</li>
                  <li>Termenele pot varia în funcție de disponibilitatea produsului</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Costuri de livrare
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Livrare gratuită pentru comenzi peste 200 RON</li>
                  <li>Cost standard de livrare: 15-25 RON (în funcție de regiune)</li>
                  <li>Livrare express: +10 RON față de livrarea standard</li>
                  <li>Costurile exacte sunt afișate la finalizarea comenzii</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              7. Politica de retur
            </h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Dreptul de retur
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Ai dreptul de a returna produsele în termen de 14 zile calendaristice de la primirea acestora, 
                  fără a fi nevoie să motivezi decizia.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Condiții pentru retur
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Produsele trebuie să fie în starea originală</li>
                  <li>Etichetele și ambalajul trebuie să fie intacte</li>
                  <li>Produsele personalizate nu pot fi returnate</li>
                  <li>Produsele perisabile nu pot fi returnate</li>
                  <li>Costurile de retur sunt suportate de cumpărător</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Procesul de retur
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Contactează vânzătorul prin platformă</li>
                  <li>Completează formularul de retur</li>
                  <li>Împachetează produsele în ambalajul original</li>
                  <li>Trimite produsele la adresa indicată</li>
                  <li>Primești rambursarea în termen de 14 zile</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              8. Proprietatea intelectuală
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Toate drepturile de proprietate intelectuală asupra platformei Pots.ro, 
              inclusiv designul, conținutul, logo-urile și software-ul, aparțin companiei Pots.ro S.R.L.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Utilizarea conținutului
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Nu poți copia, modifica sau distribui conținutul fără permisiunea noastră</li>
                <li>Nu poți folosi logo-urile sau mărcile noastre fără acordul nostru</li>
                <li>Conținutul creat de utilizatori rămâne proprietatea acestora</li>
                <li>Prin încărcarea conținutului, acordă dreptul de utilizare pe platformă</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              9. Limitarea răspunderii
            </h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ⚠️ Limitări importante
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Pots.ro este doar o platformă intermediară între vânzători și cumpărători</li>
                <li>Nu suntem responsabili pentru calitatea produselor vândute de terți</li>
                <li>Nu garantăm disponibilitatea continuă a platformei</li>
                <li>Nu suntem responsabili pentru pierderile rezultate din utilizarea platformei</li>
                <li>Răspunderea noastră este limitată la valoarea comisioanelor percepute</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              10. Suspensarea și închiderea conturilor
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Ne rezervăm dreptul de a suspenda sau închide conturile care:
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Încalcă acești termeni și condiții</li>
              <li>Furnizează informații false sau incomplete</li>
              <li>Folosesc platforma pentru activități ilegale</li>
              <li>Nu respectă politicile de plată</li>
              <li>Crează probleme pentru alți utilizatori</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              11. Legea aplicabilă și jurisdicția
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Acești termeni și condiții sunt guvernați de legea română. Orice dispută 
                va fi soluționată de instanțele competente din România.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Înainte de a recurge la instanțe, părțile se angajează să încerce să 
                rezolve disputa prin negociere directă sau prin mediere.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              12. Modificări ale termenilor
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300">
              Ne rezervăm dreptul de a modifica acești termeni și condiții în orice moment. 
              Modificările vor fi publicate pe această pagină și vor intra în vigoare imediat. 
              Utilizarea continuă a platformei după modificări constituie acceptarea noilor termeni.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              13. Contact
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Pentru întrebări despre acești termeni și condiții, contactează-ne:
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Email:</strong> legal@pots.ro<br />
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
