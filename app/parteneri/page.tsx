import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Parteneri - FloristMarket',
  description: 'Descoperă partenerii noștri de încredere din industria florală și logistică.',
};

export default function ParteneriPage() {
  const partners = [
    {
      name: 'Fan Courier',
      description: 'Livrare rapidă și sigură în toată România',
      logo: '/partners/fan-courier.svg',
      category: 'Curierat'
    },
    {
      name: 'DPD',
      description: 'Servicii de livrare premium pentru produse delicate',
      logo: '/partners/dpd.svg',
      category: 'Curierat'
    },
    {
      name: 'Cargus',
      description: 'Soluții logistice complete pentru florării',
      logo: '/partners/cargus.svg',
      category: 'Curierat'
    },
    {
      name: 'Sameday',
      description: 'Livrare în aceeași zi pentru comenzi urgente',
      logo: '/partners/sameday.svg',
      category: 'Curierat'
    },
    {
      name: 'Netopia',
      description: 'Plăți online sigure și rapide',
      logo: '/partners/netopia.svg',
      category: 'Plăți'
    }
  ];

  const categories = ['Curierat', 'Plăți'];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-6">
            Partenerii noștri
          </h1>
          <p className="text-xl text-subink max-w-3xl mx-auto">
            Colaborăm cu cei mai de încredere furnizori de servicii pentru a-ți oferi 
            cea mai bună experiență de cumpărare.
          </p>
        </div>

        {/* Partners by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-16">
            <h2 className="text-2xl font-semibold text-ink mb-8 text-center">
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners
                .filter(partner => partner.category === category)
                .map((partner) => (
                  <div 
                    key={partner.name}
                    className="bg-white rounded-xl p-6 shadow-sm border border-line hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 relative mr-4">
                        <Image
                          src={partner.logo}
                          alt={`${partner.name} logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-ink">
                        {partner.name}
                      </h3>
                    </div>
                    
                    <p className="text-subink text-sm leading-relaxed">
                      {partner.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-bg-soft rounded-xl">
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Vrei să devii partener?
          </h2>
          <p className="text-subink mb-6 max-w-2xl mx-auto">
            Dacă oferi servicii de calitate în industria florală sau logistică, 
            suntem deschiși să discutăm despre o colaborare.
          </p>
          <a 
            href="mailto:parteneri@floristmarket.ro"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contactează-ne
          </a>
        </div>
      </div>
    </div>
  );
}
