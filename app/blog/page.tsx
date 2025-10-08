import React from "react";
import { Metadata } from 'next';
import { H1, P } from '@/components/ui/typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const revalidate = 60;

// Articole SEO optimizate pentru 2025 - România
const blogPosts = [
  {
    id: '1',
    title: 'Ghivece Ceramice Premium România 2025: Ghid Complet pentru Alegerea Perfectă',
    slug: 'ghivece-ceramice-premium-romania-2025',
    excerpt: 'Descoperă cele mai bune ghivece ceramice din România pentru 2025. Ghid expert cu teste de calitate, materiale premium și sfaturi de specialiști pentru alegerea ghiveciului ideal pentru plantele tale.',
    content: '# Ghivece Ceramice Premium România 2025\n\nConținut expert despre ghivece ceramice...',
    publishedAt: '2025-01-15T10:00:00Z',
    author: 'Dr. Maria Popescu - Expert Botanică',
    image: '/blog/ghivece-ceramice-premium-2025.jpg',
    tags: ['ghivece ceramice', 'romania', '2025', 'plante interioare', 'ghid expert', 'calitate premium'],
    readingTime: '8 min de citire'
  },
  {
    id: '2',
    title: 'Tendințe design floral România 2026: naturalețe, tehnologie discretă și expresii locale',
    slug: 'tendinte-design-floral-romania-2026',
    excerpt: 'În 2026, designul floral în România renaște din conexiunea cu natura locală, reinterpretată prin tehnologie discretă și sensibilitate contextuală. Nu mai vrem doar frumos - vrem poveste, semnificație și durabilitate în fiecare aranjament.',
    content: '# Tendințe Design Floral România 2026\n\nAnaliză completă a trendurilor...',
    publishedAt: '2025-10-15T14:30:00Z',
    author: 'Echipa FloristMarket',
    image: '/blog/buchet-galben.png',
    tags: ['design floral', 'romania', '2026', 'naturalețe', 'tehnologie discretă', 'sustainability'],
    readingTime: '6 min de citire'
  },
  {
    id: '3',
    title: 'Îngrijire Plante Interioare România 2025: Sistem Complet pentru Clima Locală',
    slug: 'ingrijire-plante-interioare-romania-2025',
    excerpt: 'Ghid expert pentru îngrijirea plantelor interioare în România în 2025. Adaptare la clima locală, sisteme de irigație automată, controlul umidității și protecția împotriva dăunătorilor.',
    content: '# Îngrijire Plante Interioare România 2025\n\nSistem complet de îngrijire...',
    publishedAt: '2025-01-05T09:15:00Z',
    author: 'Prof. Ana Maria - Specialist Horticultură',
    image: '/blog/ingrijire-plante-interioare-2025.jpg',
    tags: ['plante interioare', 'romania', '2025', 'îngrijire', 'clima locală', 'sistem automat'],
    readingTime: '12 min de citire'
  }
];

export const metadata: Metadata = {
  title: 'Blog Expert Ghivece și Plante România 2025 | Ghiduri Complete | Pots.ro',
  description: 'Blog expert cu ghiduri complete pentru ghivece ceramice, plante interioare și design floral în România 2025. Sfaturi de specialiști, tendințe moderne și soluții pentru clima locală.',
  keywords: 'ghivece ceramice romania, plante interioare romania, design floral 2025, ghivece premium, îngrijire plante, tendințe florale, blog expert ghivece',
  openGraph: {
    title: 'Blog Expert Ghivece și Plante România 2025 | Pots.ro',
    description: 'Ghiduri complete pentru ghivece ceramice premium, plante interioare și design floral modern în România. Expertiza de specialiști pentru 2025.',
    type: 'website',
    siteName: 'Pots.ro - Ghivece Premium România',
    locale: 'ro_RO',
    images: ['/og-blog-expert-2025.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Expert Ghivece și Plante România 2025',
    description: 'Ghiduri complete pentru ghivece ceramice premium și plante interioare în România. Expertiza de specialiști pentru 2025.',
    images: ['/og-blog-expert-2025.jpg']
  },
  alternates: {
    canonical: 'https://pots.ro/blog'
  }
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <H1 className="mb-4">Ghiduri Expert Ghivece și Plante România 2025</H1>
          <P className="text-lg text-gray-600 max-w-3xl mx-auto">
            Descoperă cele mai complete ghiduri pentru ghivece ceramice premium, plante interioare și design floral modern în România. 
            Expertiza de specialiști, teste de calitate și soluții adaptate pentru clima locală.
          </P>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Expert România</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">2025</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Ghiduri Complete</span>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <CardTitle className="line-clamp-2 group-hover:text-green-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </CardTitle>
                
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.publishedAt).toLocaleDateString('ro-RO')}
                    </div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {post.readingTime}
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group/link"
                >
                  Citește mai mult
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center border border-green-200">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Ghiduri Expert Direct în Inbox</h2>
          <P className="text-gray-600 mb-6 max-w-lg mx-auto text-lg">
            Primește ghiduri complete pentru ghivece ceramice premium, tendințe design floral 2025 și sfaturi de specialiști pentru plante interioare în România.
          </P>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Email pentru ghiduri expert"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
            />
            <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold text-lg shadow-lg">
              Primește Ghiduri
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✓ Ghiduri gratuite ✓ Fără spam ✓ Doar conținut expert
          </p>
        </div>
      </main>
    </div>
  );
}
