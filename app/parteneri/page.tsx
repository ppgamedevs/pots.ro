import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/db';
import { sellers } from '@/db/schema/core';
import { eq, desc, count } from 'drizzle-orm';
import { products } from '@/db/schema/core';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Parteneri și Vânzători Verificați | ${SITE_NAME}`,
  description: 'Descoperă partenerii noștri de încredere și vânzătorii verificați din industria florală. Produse de calitate pentru floriști.',
  alternates: {
    canonical: `${SITE_URL}/parteneri`,
  },
  openGraph: {
    title: `Parteneri și Vânzători | ${SITE_NAME}`,
    description: 'Vânzători verificați și parteneri de încredere pentru produse floristice de calitate.',
    type: 'website',
    url: `${SITE_URL}/parteneri`,
    locale: 'ro_RO',
  },
};

interface SellerWithCount {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
  productCount: number;
}

async function getVerifiedSellers(): Promise<SellerWithCount[]> {
  try {
    const sellersData = await db
      .select({
        id: sellers.id,
        brandName: sellers.brandName,
        slug: sellers.slug,
        logoUrl: sellers.logoUrl,
        verified: sellers.verified,
      })
      .from(sellers)
      .where(eq(sellers.status, 'active'))
      .orderBy(desc(sellers.verified), desc(sellers.createdAt));

    // Get product counts for each seller
    const sellersWithCounts = await Promise.all(
      sellersData.map(async (seller) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.sellerId, seller.id));
        
        return {
          ...seller,
          verified: seller.verified ?? false,
          productCount: countResult?.count || 0,
        };
      })
    );

    return sellersWithCounts.filter(s => s.productCount > 0);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
}

export default async function ParteneriPage() {
  const verifiedSellers = await getVerifiedSellers();
  
  const servicePartners = [
    {
      name: 'Cargus',
      description: 'Soluții logistice complete pentru florării',
      logo: '/partners/cargus.svg',
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

  // Generate JSON-LD for sellers hub
  const sellersSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Vânzători Verificați FloristMarket",
    description: "Lista completă de vânzători verificați pe FloristMarket.ro",
    numberOfItems: verifiedSellers.length,
    itemListElement: verifiedSellers.map((seller, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Organization",
        name: seller.brandName,
        url: `${SITE_URL}/s/${seller.slug}`,
        logo: seller.logoUrl,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasă",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Parteneri",
        item: `${SITE_URL}/parteneri`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellersSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-6">
              Parteneri și Vânzători Verificați
            </h1>
            <p className="text-xl text-subink max-w-3xl mx-auto">
              Colaborăm cu cei mai de încredere vânzători și furnizori de servicii 
              pentru a-ți oferi cea mai bună experiență.
            </p>
          </div>

          {/* Verified Sellers Section */}
          {verifiedSellers.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-semibold text-ink mb-2 text-center">
                Vânzători Verificați
              </h2>
              <p className="text-center text-subink mb-8">
                {verifiedSellers.length} vânzători activi cu produse de calitate
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {verifiedSellers.map((seller) => (
                  <Link 
                    key={seller.id}
                    href={`/s/${seller.slug}`}
                    className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-line hover:shadow-lg hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 relative mr-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                        {seller.logoUrl ? (
                          <Image
                            src={seller.logoUrl}
                            alt={`${seller.brandName} logo`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                            {seller.brandName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-ink group-hover:text-primary transition-colors truncate">
                          {seller.brandName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {seller.verified && (
                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                              <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verificat
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-subink">
                      {seller.productCount} {seller.productCount === 1 ? 'produs' : 'produse'} disponibile
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Service Partners by Category */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-ink mb-8 text-center">
              Parteneri de Servicii
            </h2>
            
            {categories.map((category) => (
              <div key={category} className="mb-12">
                <h3 className="text-lg font-medium text-ink mb-6 text-center">
                  {category}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {servicePartners
                    .filter(partner => partner.category === category)
                    .map((partner) => (
                      <div 
                        key={partner.name}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-line hover:shadow-md transition-shadow"
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
                          <h4 className="text-lg font-semibold text-ink">
                            {partner.name}
                          </h4>
                        </div>
                        
                        <p className="text-subink text-sm leading-relaxed">
                          {partner.description}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 p-8 bg-bg-soft dark:bg-slate-800 rounded-xl">
            <h2 className="text-2xl font-semibold text-ink mb-4">
              Vrei să devii partener?
            </h2>
            <p className="text-subink mb-6 max-w-2xl mx-auto">
              Dacă vinzi produse floristice sau oferi servicii în industria florală, 
              înscrie-te ca vânzător pe platformă.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/seller/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Devino Vânzător
              </Link>
              <a 
                href="mailto:parteneri@floristmarket.ro"
                className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-700 text-ink border border-line rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Contactează-ne
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
