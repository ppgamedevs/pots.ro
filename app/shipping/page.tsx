import { Metadata } from "next";
import { Truck, MapPin, Clock, Package, Shield, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Livrare și plăți - Pots.ro",
  description: "Informații despre livrarea produselor, costuri, termene și metodele de plată acceptate pe Pots.ro.",
};

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Livrare și plăți
        </h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ultima actualizare:</strong> 15 Decembrie 2024
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Aici găsești toate informațiile despre livrarea produselor și metodele de plată 
              acceptate pe platforma Pots.ro.
            </p>
          </section>

          {/* Delivery Overview */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Livrarea produselor
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Truck className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Livrare rapidă
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  2-5 zile lucrătoare în toată țara
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <MapPin className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Livrare națională
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Livrăm în toate orașele din România
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                <Shield className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Livrare sigură
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Produsele sunt protejate în timpul transportului
                </p>
              </div>
            </div>
          </section>

          {/* Delivery Times */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Termene de livrare
            </h2>
            
            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-brand mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Livrare standard
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">
                      <strong>2-5 zile lucrătoare</strong> în toată țara
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>București: 1-2 zile lucrătoare</li>
                      <li>Orașe mari (Cluj, Timișoara, Iași): 2-3 zile lucrătoare</li>
                      <li>Alte localități: 3-5 zile lucrătoare</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Package className="h-6 w-6 text-brand mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Livrare express
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">
                      <strong>1-2 zile lucrătoare</strong> pentru produsele disponibile
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Disponibilă pentru anumite produse</li>
                      <li>Cost suplimentar de 10 RON</li>
                      <li>Pentru comenzi plasate înainte de ora 14:00</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Truck className="h-6 w-6 text-brand mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Livrare în aceeași zi
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">
                      <strong>Doar pentru București</strong> - pentru comenzile plasate înainte de ora 14:00
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li>Disponibilă pentru produsele din stoc</li>
                      <li>Cost suplimentar de 15 RON</li>
                      <li>Livrare între orele 18:00-22:00</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Costs */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Costuri de livrare
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 dark:border-slate-700 rounded-lg">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Valoarea comenzii
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      București
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Orașe mari
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                      Alte localități
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Sub 200 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      15 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      20 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      25 RON
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Peste 200 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="text-green-600 font-semibold">GRATUIT</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="text-green-600 font-semibold">GRATUIT</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="text-green-600 font-semibold">GRATUIT</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      Livrare express
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      +10 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      +10 RON
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      +10 RON
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Payment Methods */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Metode de plată
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Plăți online
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <CreditCard className="h-6 w-6 text-brand" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Carduri de credit/debit
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Visa, Mastercard, American Express
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Shield className="h-6 w-6 text-brand" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Plăți securizate
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Procesate prin sisteme criptate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Package className="h-6 w-6 text-brand" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Ramburs la livrare
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Pentru anumite produse și comenzi
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Securitatea plăților
                </h3>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li>• Toate plățile sunt criptate SSL</li>
                    <li>• Nu stocăm informațiile despre carduri</li>
                    <li>• Procesare prin procesatori autorizați</li>
                    <li>• Protecție împotriva fraudelor</li>
                    <li>• Conformitate PCI DSS</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Process */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Procesul de livrare
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Procesarea comenzii
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Comanda ta este procesată și confirmată în termen de 24 de ore. 
                    Primești un email de confirmare cu detaliile comenzii.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Pregătirea produselor
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Vânzătorul pregătește produsele pentru expediere, verifică calitatea 
                    și le ambalează cu grijă pentru transport.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Expedierea
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Produsele sunt predate către curier și primești un număr de urmărire 
                    pentru a monitoriza progresul livrării.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Livrarea
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Curierul îți livrează produsele la adresa specificată. Poți verifica 
                    statusul livrării în timp real.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Special Delivery */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Livrări speciale
            </h2>
            
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Produse fragile
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Produsele fragile (ceramică, sticlă) sunt ambalate cu atenție specială 
                  și marcate pentru manipulare cu grijă. Costurile de livrare pot fi 
                  ușor mai mari pentru a asigura protecția optimă.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Comenzi mari
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Pentru comenzi peste 1000 RON, oferim livrare gratuită și asistență 
                  specială pentru instalare sau montare (dacă este necesar).
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Produse perisabile
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Pentru produsele perisabile (plante, flori), livrarea se face în 
                  termen de 24 de ore și cu ambalare specială pentru menținerea frescimii.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-slate-50 dark:bg-slate-800 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Ai întrebări despre livrare?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Echipa noastră de suport este aici să te ajute cu orice întrebare despre livrare și plăți.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:shipping@floristmarket.ro" className="btn btn-primary">
                Email livrare
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
