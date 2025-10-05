/**
 * Pagină individuală articol blog
 * ISR cu regenerare la cerere
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { H1, P } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Calendar, User, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

// Mock data pentru blog posts
const blogPosts = [
  {
    id: '1',
    title: 'Cum să alegi ghiveciul perfect pentru plantele tale',
    slug: 'cum-alegi-ghiveciul-perfect',
    excerpt: 'Ghid complet pentru alegerea ghiveciului potrivit pentru fiecare tip de plantă. Materiale, dimensiuni, drenaj și sfaturi practice pentru îngrijirea optimă.',
    publishedAt: '2024-01-20T10:00:00Z',
    author: 'Elena Popescu',
    image: '/blog/ghiveci-perfect.jpg',
    tags: ['ghid', 'ghivece', 'plante', 'îngrijire'],
    readTime: '5 min',
    file: 'cum-alegi-ghiveciul-perfect.md'
  },
  {
    id: '2',
    title: 'Tendințe în designul floral pentru 2024',
    slug: 'tendinte-design-floral-2024',
    excerpt: 'Descoperă cele mai noi tendințe în lumea designului floral: minimalismul japonez, culorile tropicale, ghivecele sculpturale și tehnologia smart.',
    publishedAt: '2024-01-15T14:30:00Z',
    author: 'Mihai Ionescu',
    image: '/blog/tendinte-florale-2024.jpg',
    tags: ['trenduri', 'design', 'florărie', '2024'],
    readTime: '7 min',
    file: 'tendinte-design-floral-2024.md'
  },
  {
    id: '3',
    title: 'Îngrijirea plantelor în sezonul rece',
    slug: 'ingrijirea-plantelor-sezon-rece',
    excerpt: 'Sfaturi practice pentru a-ți menține plantele sănătoase în timpul iernii. Temperatură, umiditate, lumină și protecția împotriva dăunătorilor.',
    publishedAt: '2024-01-10T09:15:00Z',
    author: 'Ana Maria',
    image: '/blog/sezon-rece.jpg',
    tags: ['îngrijire', 'iarnă', 'plante', 'sfaturi'],
    readTime: '4 min',
    file: 'ingrijirea-plantelor-sezon-rece.md'
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

  // Citim conținutul din fișierul markdown
  let content = '';
  try {
    const filePath = path.join(process.cwd(), 'content', 'blog', post.file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Procesăm markdown-ul în HTML
    const processedContent = await remark()
      .use(html)
      .process(fileContent);
    content = processedContent.toString();
  } catch (error) {
    console.error('Error reading blog post:', error);
    content = '<p>Conținutul articolului nu a putut fi încărcat.</p>';
  }

  const breadcrumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: post.title, href: `/blog/${post.slug}` }
  ];

  return (
    <div className="min-h-screen bg-white">
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
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-green-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: content }}
          />

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
    </div>
  );
}
