import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Despre noi - Pots.ro",
  description: "Află mai multe despre Pots.ro, marketplace-ul românesc pentru produse de floristică și grădinărit.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Despre noi
        </h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Cine suntem
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Pots.ro este primul marketplace românesc dedicat exclusiv produselor de floristică, 
              grădinărit și design interior. Ne-am născut din pasiunea pentru frumusețea naturii 
              și dorința de a conecta producătorii locali cu clienții care apreciază calitatea 
              și autenticitatea produselor handmade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Misiunea noastră
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Vrem să democratizăm accesul la produse de calitate pentru grădinărit și decor, 
              oferind o platformă sigură și ușor de folosit unde artizanii și producătorii 
              locali își pot prezenta creațiile, iar clienții pot descoperi produse unice 
              și durabile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Valori
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Sustenabilitate
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Promovăm produse eco-friendly și practici durabile în grădinărit.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Calitate
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Fiecare produs este verificat pentru a asigura standarde înalte de calitate.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Comunitate
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Construim o comunitate puternică de iubitori ai naturii și grădinăritului.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Inovație
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Folosim tehnologia pentru a îmbunătăți experiența de cumpărare și vânzare.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Echipa noastră
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Suntem o echipă tânără și pasionată de tehnologie și natură. Fiecare membru 
              al echipei aduce experiența și entuziasmul necesar pentru a construi cea mai 
              bună platformă de e-commerce pentru produsele de floristică din România.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Contact
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                <strong>Email:</strong> hello@floristmarket.ro
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                <strong>Telefon:</strong> +40 721 123 456
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Adresă:</strong> Str. Exemplu 123, București, România
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
