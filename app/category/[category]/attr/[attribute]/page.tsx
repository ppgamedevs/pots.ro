/**
 * Pagină SEO micro-landing pentru atribut de categorie
 * Ex: /category/ghivece/attr/ceramica-alba
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { categories, products, sellers } from '@/db/schema/core';
import { eq, and, like } from 'drizzle-orm';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { Badge } from '@/components/ui/badge';
import { SITE_NAME } from '@/lib/constants';
import { H1, P } from '@/components/ui/typography';

interface CategoryAttributePageProps {
  params: Promise<{
    category: string;
    attribute: string;
  }>;
}

// Helper pentru decodarea slug-ului în text friendly
function decodeAttributeSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: CategoryAttributePageProps): Promise<Metadata> {
  const { category, attribute } = await params;
  
  // Găsește categoria
  const categoryData = await db.query.categories.findFirst({
    where: eq(categories.slug, category)
  });

  if (!categoryData) {
    return {
      title: `Categorie nu a fost găsită | ${SITE_NAME}`,
      description: 'Categoria căutată nu a fost găsită pe Pots.ro'
    };
  }

  const attributeName = decodeAttributeSlug(attribute);
  const title = `${attributeName} ${categoryData.name} la prețuri românești – ${SITE_NAME}`;
  const description = `Descoperă ${attributeName.toLowerCase()} ${categoryData.name.toLowerCase()} de calitate la prețuri accesibile. Livrare rapidă în toată România.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
      images: [
        {
          url: '/og-category-attribute.jpg',
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-category-attribute.jpg']
    },
    alternates: {
      canonical: `https://floristmarket.ro/category/${category}/attr/${attribute}`
    }
  };
}

export default async function CategoryAttributePage({ params }: CategoryAttributePageProps) {
  const { category, attribute } = await params;

  // Găsește categoria
  const categoryData = await db.query.categories.findFirst({
    where: eq(categories.slug, category)
  });

  if (!categoryData) {
    notFound();
  }

  const attributeName = decodeAttributeSlug(attribute);

  // Găsește produsele care conțin atributul în titlu sau descriere
  const filteredProducts = await db.query.products.findMany({
    where: and(
      eq(products.categoryId, categoryData.id),
      eq(products.status, 'active'),
      like(products.title, `%${attributeName}%`)
    ),
    with: {
      seller: {
        columns: {
          id: true,
          brandName: true,
          slug: true
        }
      },
      category: {
        columns: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    limit: 24
  });

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Categorii', href: '/categories' },
    { name: categoryData.name, href: `/c/${category}` },
    { name: attributeName, href: `/category/${category}/attr/${attribute}` }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-sm">
              {categoryData.name}
            </Badge>
            <Badge variant="default" className="text-sm">
              {attributeName}
            </Badge>
          </div>
          
          <H1 className="mb-4">
            {attributeName} {categoryData.name}
          </H1>
          
          <P className="text-lg text-gray-600 max-w-3xl">
            Descoperă o selecție curată de {attributeName.toLowerCase()} {categoryData.name.toLowerCase()} 
            de calitate superioară. Toate produsele sunt verificate și livrate rapid în toată România.
          </P>
        </div>

        {/* Filtre pre-aplicate */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-medium mb-3">Filtre aplicate:</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-2">
              Categorie: {categoryData.name}
              <button className="text-gray-500 hover:text-gray-700">×</button>
            </Badge>
            <Badge variant="secondary" className="gap-2">
              Atribut: {attributeName}
              <button className="text-gray-500 hover:text-gray-700">×</button>
            </Badge>
            <Badge variant="secondary" className="gap-2">
              Status: Active
              <button className="text-gray-500 hover:text-gray-700">×</button>
            </Badge>
          </div>
        </div>

        {/* Rezultate */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {filteredProducts.length} produse găsite
            </h2>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.priceCents / 100, // Convert from cents
                    currency: product.currency || 'RON',
                    images: product.imageUrl ? [product.imageUrl] : [],
                    seller: {
                      id: (product.seller as any).id,
                      name: (product.seller as any).brandName,
                      slug: (product.seller as any).slug
                    },
                    category: {
                      id: (product.category as any).id,
                      name: (product.category as any).name,
                      slug: (product.category as any).slug
                    },
                    status: product.status as 'active' | 'draft' | 'archived',
                    createdAt: product.createdAt.toISOString(),
                    updatedAt: product.updatedAt.toISOString()
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nu am găsit produse
              </h3>
              <p className="text-gray-500 mb-4">
                Nu există produse {attributeName.toLowerCase()} în categoria {categoryData.name.toLowerCase()}.
              </p>
              <a
                href={`/c/${category}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Vezi toate produsele din {categoryData.name}
              </a>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="mt-12 prose prose-lg max-w-none">
          <h2>De ce să alegi {attributeName.toLowerCase()} {categoryData.name.toLowerCase()}?</h2>
          <p>
            {attributeName} {categoryData.name.toLowerCase()} oferă o combinație perfectă între estetică și funcționalitate. 
            Aceste produse sunt selectate cu grijă pentru a satisface cele mai înalte standarde de calitate.
          </p>
          
          <h3>Caracteristici principale:</h3>
          <ul>
            <li>Materiale de calitate superioară</li>
            <li>Design modern și elegant</li>
            <li>Durabilitate îndelungată</li>
            <li>Prețuri competitive</li>
          </ul>
          
          <h3>Livrare și garanție</h3>
          <p>
            Toate produsele {attributeName.toLowerCase()} sunt livrate rapid în toată România, 
            cu garanție de calitate și suport clienți dedicat.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
