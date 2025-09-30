import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact - Pots.ro",
  description: "Contactează-ne pentru întrebări, suport tehnic sau colaborări. Suntem aici să te ajutăm!",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Contact
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Informații de contact
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-brand mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Email</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    <a href="mailto:hello@pots.ro" className="hover:text-brand transition-colors">
                      hello@pots.ro
                    </a>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Răspundem în 24 de ore
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-brand mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Telefon</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    <a href="tel:+40721123456" className="hover:text-brand transition-colors">
                      +40 721 123 456
                    </a>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Luni - Vineri: 9:00 - 18:00
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-brand mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Adresă</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Str. Exemplu 123<br />
                    București, România
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-brand mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Program</h3>
                  <div className="text-slate-600 dark:text-slate-300 space-y-1">
                    <p>Luni - Vineri: 9:00 - 18:00</p>
                    <p>Sâmbătă: 10:00 - 16:00</p>
                    <p>Duminică: Închis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Trimite-ne un mesaj
            </h2>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nume complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Introdu numele tău"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  placeholder="introdu@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subiect *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Selectează subiectul</option>
                  <option value="general">Întrebare generală</option>
                  <option value="support">Suport tehnic</option>
                  <option value="seller">Devino seller</option>
                  <option value="partnership">Parteneriat</option>
                  <option value="other">Altele</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mesaj *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Scrie mesajul tău aici..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-white py-3 px-6 rounded-lg font-medium hover:bg-brand-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                Trimite mesajul
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Întrebări frecvente
          </h2>
          
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cât durează livrarea?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Livrarea standard durează 2-5 zile lucrătoare în toată țara. Pentru București, 
                livrarea poate fi efectuată în aceeași zi pentru comenzile plasate înainte de ora 14:00.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Pot returna produsele?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Da, ai dreptul de retur în 14 zile de la primirea produsului. Produsele trebuie 
                să fie în starea originală, cu etichetele și ambalajul intact.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Cum devin seller pe platformă?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Procesul este simplu: completează formularul de înregistrare, verificăm 
                documentele și produsele tale, apoi îți activez contul de seller. 
                <a href="/become-seller" className="text-brand hover:underline ml-1">
                  Află mai multe aici
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
