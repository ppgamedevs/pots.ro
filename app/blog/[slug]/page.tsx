"use client";

import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Copy, ChevronDown, User, Calendar, Clock } from 'lucide-react';
import { POSTS, getPostBySlug, POST_CONTENT } from "@/lib/blog/posts";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TOC } from "@/components/blog/TOC";
import { ShareBar } from "@/components/blog/ShareBar";
import { PostCard } from "@/components/blog/PostCard";

// Typography components with custom fonts
const Title = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h1 className={`font-display font-bold text-5xl md:text-6xl leading-tight tracking-tight text-[#1A1A1A] ${className}`}>
    {children}
  </h1>
);

const Subtitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`font-serif text-lg text-[#4B4B4B] leading-relaxed tracking-[0.01em] ${className}`}>
    {children}
  </p>
);

const Heading2 = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`font-display font-bold text-3xl leading-tight text-[#1A1A1A] mt-12 mb-6 text-balance ${className}`}>
    {children}
  </h2>
);

const Heading3 = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-display font-semibold text-xl leading-tight text-[#1A1A1A] mt-8 mb-4 text-balance ${className}`}>
    {children}
  </h3>
);

const Paragraph = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`font-serif text-base leading-[1.8] text-[#1A1A1A] mb-6 tracking-[0.01em] ${className}`}>
    {children}
  </p>
);

const Quote = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <blockquote className={`border-l-4 border-gradient-to-b from-[#1B5232] to-[#A3C0A0] pl-6 py-4 italic font-serif text-lg text-[#4B4B4B] my-8 bg-[#FAFAF7] rounded-r-lg ${className}`}>
    {children}
  </blockquote>
);

const List = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <ul className={`space-y-3 mb-6 ${className}`}>
    {children}
  </ul>
);

const ListItem = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <li className={`flex items-start gap-3 font-serif text-base leading-[1.8] text-[#1A1A1A] tracking-[0.01em] ${className}`}>
    <span className="w-2 h-2 bg-[#1B5232] rounded-full mt-3 flex-shrink-0"></span>
    <span>{children}</span>
  </li>
);

const ImageWithCaption = ({ src, alt, caption, className = "" }: { src: string; alt: string; caption?: string; className?: string }) => (
  <figure className={`my-8 ${className}`}>
    <div className="relative overflow-hidden rounded-lg border border-[#EAEAEA]">
      <Image
        src={src}
        alt={alt}
        width={720}
        height={400}
        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
      />
    </div>
    {caption && (
      <figcaption className="text-sm italic text-[#4B4B4B] mt-3 text-center">
        {caption}
      </figcaption>
    )}
  </figure>
);

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
  const content = POST_CONTENT[post.slug] || post.excerpt;

  // Schema.org structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.cover ? `${process.env.NEXT_PUBLIC_SITE_URL}${post.cover}` : `${process.env.NEXT_PUBLIC_SITE_URL}/og-blog.jpg`,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "FloristMarket Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FloristMarket.ro",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
      }
    },
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ReadingProgress />
      
      {/* Hero Section */}
      <section className="relative w-full h-[720px] overflow-hidden">
        <div className="relative w-full h-full">
          {post.cover && (
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 pb-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-4xl"
              >
                <Title className="text-white mb-4">
                  {post.title}
                </Title>
                
                <Subtitle className="text-white/90 mb-6">
                  {post.excerpt}
                </Subtitle>
                
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{post.author?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('ro-RO', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </time>
                  </div>
                  {post.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="min-h-screen bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12">
            
            {/* Article Content */}
            <article className="max-w-3xl mx-auto lg:mx-0 px-6 lg:px-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="prose prose-lg max-w-none leading-relaxed tracking-[0.01em]"
                style={{ scrollBehavior: 'smooth' }}
              >
                {/* Render content with custom components */}
                <div 
                  className="article-content"
                  dangerouslySetInnerHTML={{ 
                    __html: content
                      .replace(/<h2>/g, '<div class="heading-2">')
                      .replace(/<\/h2>/g, '</div>')
                      .replace(/<h3>/g, '<div class="heading-3">')
                      .replace(/<\/h3>/g, '</div>')
                      .replace(/<p>/g, '<div class="paragraph">')
                      .replace(/<\/p>/g, '</div>')
                      .replace(/<ul>/g, '<div class="list">')
                      .replace(/<\/ul>/g, '</div>')
                      .replace(/<li>/g, '<div class="list-item">')
                      .replace(/<\/li>/g, '</div>')
                  }}
                />
              </motion.div>
            </article>

            {/* TOC Sidebar */}
            <aside className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="sticky top-24"
              >
                <div className="bg-white/80 backdrop-blur-xl border-l border-[#EAEAEA] pl-6 py-6 rounded-r-lg">
                  <h3 className="text-sm uppercase font-semibold text-[#1B5232] mb-4 tracking-wider">
                    Cuprins
                  </h3>
                  <TOC />
                </div>
              </motion.div>
            </aside>
          </div>
        </div>

        {/* Article Footer */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white py-16"
        >
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Share Bar */}
            <div className="max-w-[720px] mx-auto mb-12">
              <ShareBar url={url} title={post.title} />
            </div>

            {/* Related Articles */}
            <div className="max-w-[720px] mx-auto mb-16">
              <h3 className="font-display font-bold text-2xl text-[#1E1E1E] mb-8">
                Articole similare
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {POSTS.filter(p => p.slug !== post.slug).slice(0, 3).map((relatedPost, index) => (
                  <motion.div
                    key={relatedPost.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                  >
                    <PostCard {...relatedPost} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="max-w-[720px] mx-auto"
            >
              <div className="bg-gradient-to-r from-[#D9E4D0] to-[#A3C0A0] rounded-2xl p-8 text-center">
                <h3 className="font-display font-bold text-2xl text-[#1B5232] mb-4">
                  Devino vânzător pe FloristMarket
                </h3>
                <p className="font-serif text-lg text-[#4B4B4B] mb-6">
                  Alătură-te comunității noastre de florari și începe să vinzi produsele tale online.
                </p>
                <Link
                  href="/seller/apply"
                  className="inline-flex items-center gap-2 bg-[#1B5232] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#1B5232]/90 transition-colors"
                >
                  Aplică acum
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>

      {/* Custom CSS for article content */}
      <style jsx global>{`
        .article-content .heading-2 {
          font-family: var(--font-sans), 'Inter Tight', sans-serif;
          font-weight: 700;
          font-size: 1.75rem;
          line-height: 1.2;
          color: #1A1A1A;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          text-wrap: balance;
        }
        
        .article-content .heading-3 {
          font-family: var(--font-sans), 'Inter Tight', sans-serif;
          font-weight: 600;
          font-size: 1.25rem;
          line-height: 1.3;
          color: #1A1A1A;
          margin-top: 2rem;
          margin-bottom: 1rem;
          text-wrap: balance;
        }
        
        .article-content .paragraph {
          font-family: var(--font-merriweather), 'Merriweather', serif;
          font-size: 1rem;
          line-height: 1.8;
          color: #1A1A1A;
          margin-bottom: 1.5rem;
          letter-spacing: 0.01em;
        }
        
        .article-content .list {
          margin-bottom: 1.5rem;
        }
        
        .article-content .list-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-family: var(--font-merriweather), 'Merriweather', serif;
          font-size: 1rem;
          line-height: 1.8;
          color: #1A1A1A;
          margin-bottom: 0.75rem;
          letter-spacing: 0.01em;
        }
        
        .article-content .list-item::before {
          content: '';
          width: 0.5rem;
          height: 0.5rem;
          background-color: #1B5232;
          border-radius: 50%;
          margin-top: 0.75rem;
          flex-shrink: 0;
        }
        
        .article-content strong {
          font-weight: 600;
          color: #1B5232;
        }
        
        .article-content em {
          font-style: italic;
          color: #4B4B4B;
        }
        
        .article-content a {
          color: #1B5232;
          text-decoration: underline;
          text-decoration-color: #D9E4D0;
          text-underline-offset: 0.25rem;
          transition: all 0.2s ease;
        }
        
        .article-content a:hover {
          text-decoration-color: #1B5232;
        }
        
        .article-content blockquote {
          font-family: var(--font-merriweather), 'Merriweather', serif;
          font-style: italic;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #4B4B4B;
          border-left: 4px solid #1B5232;
          padding-left: 1.5rem;
          margin: 2rem 0;
          background: rgba(27, 82, 50, 0.05);
          padding: 1.5rem;
          border-radius: 0 8px 8px 0;
        }
      `}</style>
    </>
  );
}