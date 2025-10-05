import React from "react";
import { BlogHero } from "@/components/blog/BlogHero";
import { PostCard } from "@/components/blog/PostCard";
import { POSTS } from "@/lib/blog/posts";

export const revalidate = 60;

export default function BlogHomePage() {
  return (
    <div>
      <BlogHero />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="grid md:grid-cols-3 gap-6">
          {POSTS.map((p) => (<PostCard key={p.slug} {...p} />))}
        </section>
      </main>
    </div>
  );
}

/**
 * Pagină principală blog
 * Lista articole cu ISR
 */

import { Metadata } from 'next';
import { H1, P } from '@/components/ui/typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';

// Mock data pentru blog posts
const blogPosts = [
  {
    id: '1',
    title: 'Cum să alegi ghiveciul perfect pentru plantele tale',
    slug: 'cum-alegi-ghiveciul-perfect',
    excerpt: 'Ghid complet pentru alegerea ghiveciului potrivit pentru fiecare tip de plantă. Materiale, dimensiuni, drenaj și sfaturi practice pentru îngrijirea optimă.',
    content: '# Cum să alegi ghiveciul perfect pentru plantele tale\n\nConținutul complet al articolului...',
    publishedAt: '2024-01-20T10:00:00Z',
    author: 'Elena Popescu',
    image: '/blog/ghiveci-perfect.jpg',
    tags: ['ghid', 'ghivece', 'plante', 'îngrijire'],
    readingTime: '5 min de citire'
  },
  {
    id: '2',
    title: 'Tendințe în designul floral pentru 2024',
    slug: 'tendinte-design-floral-2024',
    excerpt: 'Descoperă cele mai noi tendințe în lumea designului floral: minimalismul japonez, culorile tropicale, ghivecele sculpturale și tehnologia smart.',
    content: '# Tendințe în designul floral pentru 2024\n\nConținutul complet al articolului...',
    publishedAt: '2024-01-15T14:30:00Z',
    author: 'Mihai Ionescu',
    image: '/blog/tendinte-florale-2024.jpg',
    tags: ['trenduri', 'design', 'florărie', '2024'],
    readingTime: '7 min de citire'
  },
  {
    id: '3',
    title: 'Îngrijirea plantelor în sezonul rece',
    slug: 'ingrijirea-plantelor-sezon-rece',
    excerpt: 'Sfaturi practice pentru a-ți menține plantele sănătoase în timpul iernii. Temperatură, umiditate, lumină și protecția împotriva dăunătorilor.',
    content: '# Îngrijirea plantelor în sezonul rece\n\nConținutul complet al articolului...',
    publishedAt: '2024-01-10T09:15:00Z',
    author: 'Ana Maria',
    image: '/blog/sezon-rece.jpg',
    tags: ['îngrijire', 'iarnă', 'plante', 'sfaturi'],
    readingTime: '4 min de citire'
  }
];

export const metadata: Metadata = {
  title: 'Blog | Pots.ro',
  description: 'Descoperă cele mai noi articole despre plante, ghivece și îngrijirea grădinii. Sfaturi practice de la experții noștri.',
  openGraph: {
    title: 'Blog | Pots.ro',
    description: 'Descoperă cele mai noi articole despre plante, ghivece și îngrijirea grădinii.',
    type: 'website',
    siteName: 'Pots.ro',
    images: ['/og-blog.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Pots.ro',
    description: 'Descoperă cele mai noi articole despre plante, ghivece și îngrijirea grădinii.',
    images: ['/og-blog.jpg']
  }
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <H1 className="mb-4">Blog Pots.ro</H1>
          <P className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descoperă cele mai noi articole despre plante, ghivece și îngrijirea grădinii. 
            Sfaturi practice de la experții noștri.
          </P>
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
        <div className="bg-green-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Abonează-te la newsletter</h2>
          <P className="text-gray-600 mb-6 max-w-md mx-auto">
            Primește cele mai noi articole și sfaturi despre îngrijirea plantelor direct în inbox.
          </P>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Adresa ta de email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Abonează-te
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
