import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ANPC - Autoritatea Națională pentru Protecția Consumatorilor',
  description: 'Informații despre drepturile consumatorilor și procedurile ANPC.',
};

export default function ANPCPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-6">
            ANPC - Autoritatea Națională pentru Protecția Consumatorilor
          </h1>
          <p className="text-xl text-subink max-w-3xl mx-auto">
            Informații despre drepturile tale ca consumator și procedurile de soluționare a litigiilor.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* What is ANPC */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-line">
            <h2 className="text-2xl font-semibold text-ink mb-6">Ce este ANPC?</h2>
            <p className="text-subink leading-relaxed mb-4">
              Autoritatea Națională pentru Protecția Consumatorilor (ANPC) este instituția publică 
              responsabilă cu protejarea și promovarea drepturilor consumatorilor din România.
            </p>
            <p className="text-subink leading-relaxed">
              ANPC se ocupă de monitorizarea respectării legislației de protecție a consumatorilor, 
              soluționarea litigiilor și informarea consumatorilor despre drepturile lor.
            </p>
          </section>

          {/* Consumer Rights */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-line">
            <h2 className="text-2xl font-semibold text-ink mb-6">Drepturile tale ca consumator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-ink">Drepturi generale</h3>
                <ul className="space-y-2 text-subink">
                  <li>• Dreptul la informare corectă și completă</li>
                  <li>• Dreptul la siguranța produselor și serviciilor</li>
                  <li>• Dreptul la protecție împotriva practicilor comerciale neloiale</li>
                  <li>• Dreptul la educație și formare</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-ink">Drepturi la cumpărare online</h3>
                <ul className="space-y-2 text-subink">
                  <li>• Dreptul de retragere în 14 zile</li>
                  <li>• Dreptul la returnarea produselor defecte</li>
                  <li>• Dreptul la garanție și service</li>
                  <li>• Dreptul la protecția datelor personale</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to File a Complaint */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-line">
            <h2 className="text-2xl font-semibold text-ink mb-6">Cum depui o plângere</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium text-ink mb-2">Documentează problema</h3>
                  <p className="text-subink">
                    Păstrează toate documentele relevante: facturi, contracte, corespondența cu comerciantul.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium text-ink mb-2">Încearcă soluționarea amiabilă</h3>
                  <p className="text-subink">
                    Contactează comerciantul pentru a rezolva problema în mod amiabil înainte de a depune plângerea.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium text-ink mb-2">Depune plângerea la ANPC</h3>
                  <p className="text-subink">
                    Completează formularul online sau depune plângerea la sediul ANPC din județul tău.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-line">
            <h2 className="text-2xl font-semibold text-ink mb-6">Contact ANPC</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-ink mb-4">Informații generale</h3>
                <div className="space-y-3 text-subink">
                  <p><strong>Website oficial:</strong></p>
                  <a 
                    href="https://anpc.ro" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    www.anpc.ro
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                  
                  <p><strong>Telefon:</strong> 021.955.55</p>
                  <p><strong>Email:</strong> contact@anpc.ro</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-ink mb-4">Plângeri online</h3>
                <div className="space-y-3 text-subink">
                  <p>Poți depune plângerea direct pe platforma online ANPC:</p>
                  <a 
                    href="https://plangeri.anpc.ro" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    plangeri.anpc.ro
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* FloristMarket Commitment */}
          <section className="bg-bg-soft rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-ink mb-6">Angajamentul FloristMarket</h2>
            <div className="space-y-4 text-subink">
              <p>
                La FloristMarket respectăm și promovăm drepturile consumatorilor. Dacă întâmpini 
                probleme cu comanda ta, te rugăm să ne contactezi înainte de a depune o plângere la ANPC.
              </p>
              <p>
                Echipa noastră de suport este pregătită să te ajute să rezolvi orice problemă 
                în mod rapid și eficient.
              </p>
              <div className="pt-4">
                <Link 
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Contactează-ne
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
