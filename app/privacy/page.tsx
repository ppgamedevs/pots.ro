import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate - Pots.ro",
  description: "Politica de confidențialitate și protecția datelor personale conform GDPR pentru România.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Politica de confidențialitate
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ultima actualizare:</strong> 15 Decembrie 2024
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Această Politică de confidențialitate descrie modul în care Pots.ro („noi", „compania noastră") 
              colectează, folosește și protejează informațiile tale personale în conformitate cu Regulamentul 
              General privind Protecția Datelor (GDPR) și legislația română aplicabilă.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              1. Responsabilul cu prelucrarea datelor
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                <strong>Denumirea companiei:</strong> Pots.ro S.R.L.
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                <strong>Adresa:</strong> Str. Exemplu 123, București, România
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                <strong>Email:</strong> privacy@floristmarket.ro
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Telefon:</strong> +40 721 123 456
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              2. Ce date personale colectăm
            </h2>
            
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              2.1 Date de identificare
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Nume și prenume</li>
              <li>Adresă de email</li>
              <li>Număr de telefon</li>
              <li>Adresă de livrare și facturare</li>
              <li>Data nașterii (opțional)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-6">
              2.2 Date de plată
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Informații despre cardul de credit (procesate prin procesatori de plăți securizați)</li>
              <li>Istoricul tranzacțiilor</li>
              <li>Informații despre facturare</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-6">
              2.3 Date de utilizare
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Adresa IP</li>
              <li>Tipul de browser și dispozitiv</li>
              <li>Pagini vizitate și timpul petrecut pe site</li>
              <li>Cookie-uri și tehnologii similare</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              3. Scopurile și bazele legale ale prelucrării
            </h2>
            
            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Executarea contractului
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Scop:</strong> Procesarea comenzilor, livrarea produselor, suportul clienților
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Baza legală:</strong> Art. 6(1)(b) GDPR - execuția unui contract
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Interesul legitim
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Scop:</strong> Analiza utilizării site-ului, îmbunătățirea serviciilor, marketing direct
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Baza legală:</strong> Art. 6(1)(f) GDPR - interesul legitim
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Consimțământul
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Scop:</strong> Newsletter, cookie-uri non-esențiale, marketing personalizat
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Baza legală:</strong> Art. 6(1)(a) GDPR - consimțământul
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Obligații legale
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  <strong>Scop:</strong> Păstrarea documentelor contabile, raportarea către autorități
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Baza legală:</strong> Art. 6(1)(c) GDPR - îndeplinirea unei obligații legale
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              4. Durata păstrării datelor
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Date de cont și comandă
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Păstrăm datele tale de cont și comenzile timp de 3 ani de la ultima activitate, 
                  conform legislației române privind arhivarea documentelor contabile.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Date de marketing
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Datele de marketing sunt păstrate până când îți retragi consimțământul sau 
                  până la 2 ani de la ultima interacțiune.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Cookie-uri
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Durata păstrării cookie-urilor variază de la sesiune până la 2 ani, 
                  în funcție de tipul de cookie.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              5. Partajarea datelor cu terți
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Nu vindem datele tale personale. Partajăm datele doar în următoarele situații:
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Procesatori de plăți:</strong> Pentru procesarea plăților (Stripe, PayPal)</li>
              <li><strong>Servicii de livrare:</strong> Pentru livrarea comenzilor (Fan Courier, DPD)</li>
              <li><strong>Servicii de email:</strong> Pentru trimiterea notificărilor (SendGrid)</li>
              <li><strong>Analiză web:</strong> Pentru analiza utilizării site-ului (Google Analytics)</li>
              <li><strong>Autorități:</strong> Când este cerut de lege</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              6. Drepturile tale
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Conform GDPR, ai următoarele drepturi:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul de acces
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți cere o copie a datelor tale personale pe care le deținem.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul la rectificare
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți cere corectarea datelor inexacte sau incomplete.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul la ștergere
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți cere ștergerea datelor tale în anumite circumstanțe.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul la limitarea prelucrării
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți cere limitarea prelucrării datelor tale.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul la portabilitate
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți cere transferul datelor către alt operator.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Dreptul de opoziție
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Poți să te opui prelucrării datelor tale în anumite circumstanțe.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cum să îți exerciti drepturile
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Pentru a îți exercita drepturile, contactează-ne la:
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Email:</strong> privacy@floristmarket.ro<br />
                <strong>Telefon:</strong> +40 721 123 456
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              7. Securitatea datelor
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Implementăm măsuri tehnice și organizaționale adecvate pentru a proteja datele tale:
            </p>

            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Criptarea datelor în tranzit și la rest</li>
              <li>Accesul limitat la date doar pentru personalul autorizat</li>
              <li>Monitorizarea continuă a sistemelor</li>
              <li>Backup-uri regulate și securizate</li>
              <li>Formarea personalului privind protecția datelor</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              8. Transferuri internaționale
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300">
              Unele dintre furnizorii noștri de servicii sunt situați în afara UE. În aceste cazuri, 
              ne asigurăm că există garanții adecvate pentru protecția datelor, cum ar fi deciziile 
              de adecvare ale Comisiei Europene sau clauzele contractuale standard.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              9. Cookie-uri
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Folosim cookie-uri pentru a îmbunătăți experiența ta pe site. Pentru informații 
              detaliate, consultă{" "}
              <a href="/cookies" className="text-brand hover:underline">
                Politica noastră de Cookie-uri
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              10. Modificări ale politicii
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300">
              Ne rezervăm dreptul de a modifica această politică. Orice modificări vor fi 
              publicate pe această pagină cu o nouă dată de actualizare. Te vom notifica 
              despre modificările semnificative prin email sau prin notificări pe site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              11. Autoritatea de supraveghere
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Ai dreptul să depui o plângere la Autoritatea Națională de Supraveghere a 
                Prelucrării Datelor cu Caracter Personal (ANSPDCP):
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Adresa:</strong> B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București<br />
                <strong>Website:</strong>{" "}
                <a href="https://www.dataprotection.ro" target="_blank" rel="nofollow noopener" className="text-brand hover:underline">
                  www.dataprotection.ro
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              12. Contact
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Pentru întrebări despre această politică de confidențialitate sau pentru a îți 
                exercita drepturile, contactează-ne:
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
