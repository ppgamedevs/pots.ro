/**
 * Pagină individuală articol blog
 * ISR cu regenerare la cerere
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { H1, P } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Calendar, User, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';

// Mock data pentru blog posts
const blogPosts = [
  {
    id: '1',
    title: 'Trenduri florale 2024: Ghivece și plante de modă',
    slug: 'trenduri-florale-2024',
    excerpt: 'Descoperă cele mai noi trenduri în lumea plantelor și ghivecelor pentru 2024. De la design-uri moderne la plante exotice.',
    content: `# Trenduri florale 2024: Ghivece și plante de modă

Anul 2024 aduce cu sine o nouă viziune asupra grădinăritului și decorării interioare. Iată cele mai importante trenduri pe care le vei vedea în magazinele de specialitate.

## 1. Ghivece ceramice în nuanțe naturale

Ceramica naturală este din nou în centrul atenției. Ghivecele în nuanțe de bej, crem și teracotă oferă o estetică caldă și prietenoasă, perfectă pentru orice interior.

### Caracteristici principale:
- Materiale 100% naturale
- Design minimalist și elegant
- Drenaj optim pentru rădăcini
- Durabilitate îndelungată

## 2. Plante exotice pentru interior

Plantele tropicale continuă să fie în topul preferințelor. De la monstera deliciosa la ficus lyrata, aceste plante aduc o notă exotică în casa ta.

## 3. Sistemul de irigație automată

Tehnologia vine în ajutorul grădinarilor amatori. Sistemele de irigație automată devin accesibile și ușor de instalat.

## Concluzie

Aceste trenduri reflectă o abordare mai conștientă și durabilă a grădinăritului modern. Alege produsele care se potrivesc stilului tău și bugetului disponibil.`,
    publishedAt: '2024-01-15T10:00:00Z',
    author: 'Elena Popescu',
    image: '/blog/trenduri-florale-2024.jpg',
    tags: ['trenduri', 'plante', 'ghivece'],
    readTime: '5 min'
  },
  {
    id: '2',
    title: 'Cum alegi cutia perfectă pentru plantele tale',
    slug: 'cum-alegi-cutia-perfecta',
    excerpt: 'Ghid complet pentru alegerea ghivecelor potrivite pentru fiecare tip de plantă. Materiale, dimensiuni și design.',
    content: `# Cum alegi cutia perfectă pentru plantele tale

Alegerea ghivecelor potrivite este esențială pentru sănătatea plantelor tale. Iată un ghid complet care te va ajuta să faci alegerea corectă.

## Factori de luat în considerare

### 1. Dimensiunea
- Rădăcinile trebuie să aibă spațiu suficient
- Prea mare poate cauza probleme de drenaj
- Prea mică împiedică creșterea

### 2. Materialul
- **Ceramica**: elegantă, dar grea
- **Plasticul**: ușor și ieftin
- **Lemnul**: natural, dar necesită întreținere

### 3. Sistemul de drenaj
Orice ghivec trebuie să aibă găuri de drenaj pentru a evita putrezirea rădăcinilor.

## Recomandări pe tipuri de plante

### Plante cu rădăcini adânci
- Ghivece înalte
- Materiale rezistente
- Drenaj excelent

### Plante cu rădăcini superficiale
- Ghivece late
- Materiale ușoare
- Sistem de irigație uniform

## Concluzie

Alegerea ghivecelor potrivite este o investiție în sănătatea plantelor tale. Ia în considerare toți factorii menționați pentru a face alegerea perfectă.`,
    publishedAt: '2024-01-10T14:30:00Z',
    author: 'Mihai Ionescu',
    image: '/blog/cutia-perfecta.jpg',
    tags: ['ghid', 'ghivece', 'plante'],
    readTime: '4 min'
  },
  {
    id: '3',
    title: 'Îngrijirea plantelor în sezonul rece',
    slug: 'ingrijirea-plantelor-sezon-rece',
    excerpt: 'Sfaturi practice pentru a-ți menține plantele sănătoase în timpul iernii. Temperatură, umiditate și lumină.',
    content: `# Îngrijirea plantelor în sezonul rece

Iarna poate fi o provocare pentru plantele tale, dar cu câteva sfaturi practice, le poți menține sănătoase și frumoase.

## Problemele principale ale iernii

### 1. Lumină insuficientă
- Zilele sunt mai scurte
- Intensitatea luminii scade
- Plantele pot deveni etiolate

### 2. Umiditate scăzută
- Încălzirea usucă aerul
- Frunzele pot deveni maro
- Risc de atacuri de păduchi

### 3. Temperaturi extreme
- Schimbări bruște de temperatură
- Curent de aer rece
- Supraîncălzire de la calorifere

## Soluții practice

### Pentru lumină
- Mută plantele mai aproape de ferestre
- Folosește lumini artificiale
- Curăță frunzele pentru a absorbi mai multă lumină

### Pentru umiditate
- Folosește umidificatoare
- Grupează plantele
- Pulverizează cu apă

### Pentru temperatură
- Evită sursele de căldură directă
- Menține temperaturi constante
- Protejează de curentul de aer

## Concluzie

Cu atenție și îngrijire corespunzătoare, plantele tale vor trece iarna fără probleme și vor fi gata pentru un nou sezon de creștere.`,
    publishedAt: '2024-01-05T09:15:00Z',
    author: 'Ana Maria',
    image: '/blog/sezon-rece.jpg',
    tags: ['îngrijire', 'iarnă', 'plante'],
    readTime: '6 min'
  }
];

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return {
      title: 'Articol nu a fost găsit | Blog Pots.ro',
      description: 'Articolul căutat nu a fost găsit pe blogul Pots.ro'
    };
  }

  return {
    title: `${post.title} | Blog Pots.ro`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      siteName: 'Pots.ro',
      images: [post.image],
      publishedTime: post.publishedAt,
      authors: [post.author]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image]
    },
    alternates: {
      canonical: `https://floristmarket.ro/blog/${post.slug}`
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: post.title, href: `/blog/${post.slug}` }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-8" />

        {/* Article Header */}
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <H1 className="mb-6">{post.title}</H1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString('ro-RO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
              <button className="flex items-center gap-2 text-green-600 hover:text-green-700">
                <Share2 className="h-4 w-4" />
                Distribuie
              </button>
            </div>

            {/* Featured Image */}
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-bold mt-8 mb-4">
                    {paragraph.substring(2)}
                  </h1>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">
                    {paragraph.substring(3)}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-medium mt-4 mb-2">
                    {paragraph.substring(4)}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <li key={index} className="ml-4">
                    {paragraph.substring(2)}
                  </li>
                );
              }
              if (paragraph.trim() === '') {
                return <br key={index} />;
              }
              return (
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Author Bio */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Despre autor</h3>
            <p className="text-gray-600">
              {post.author} este un expert în grădinărit cu peste 10 ani de experiență. 
              Specializează în îngrijirea plantelor de interior și oferă sfaturi practice 
              pentru grădinarii amatori.
            </p>
          </div>

          {/* Related Posts */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6">Articole similare</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .filter(p => p.id !== post.id)
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group block p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium group-hover:text-green-600 transition-colors mb-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
