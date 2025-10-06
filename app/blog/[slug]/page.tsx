import React from "react";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { PostMetaBar } from "@/components/blog/PostMetaBar";
import { ShareBar } from "@/components/blog/ShareBar";
import { TOC } from "@/components/blog/TOC";
import { POSTS, getPostBySlug, getPostContent } from "@/lib/blog/posts";
import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  const title = post.title + " | Pots.ro";
  const description = post.excerpt;
  const images = post.cover ? [post.cover] : ["/og-blog.jpg"];
  return {
    title,
    description,
    openGraph: { title, description, images, type: "article" },
    twitter: { card: "summary_large_image", title, description, images },
    alternates: { canonical: `https://pots.ro/blog/${post.slug}` }
  };
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const url = `https://pots.ro/blog/${post.slug}`;
  const html = getPostContent(post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.cover ? [`https://pots.ro${post.cover}`] : undefined,
    datePublished: post.date,
    author: post.author?.name ? { "@type": "Person", name: post.author.name } : undefined,
    description: post.excerpt,
    url
  };
  return (
    <div>
      <ReadingProgress />
      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-6xl px-4 pt-6 text-sm text-ink/60">
        <a href="/" className="hover:text-primary">Acasă</a>
        <span className="mx-2">/</span>
        <a href="/blog" className="hover:text-primary">Blog</a>
        <span className="mx-2">/</span>
        <span className="text-ink">{post.title}</span>
      </nav>

      {/* Hero modern */}
      <div className="mx-auto max-w-6xl px-4 mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <div className="aspect-[16/9]">
            <img src={post.cover || "/images/blog-cover.jpg"} alt={post.title} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-white text-2xl md:text-4xl font-semibold drop-shadow">{post.title}</h1>
            <div className="mt-2 text-white/90 text-sm flex flex-wrap items-center gap-2">
              {post.author?.name && <span>{post.author.name}</span>}
              <span>•</span>
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ro-RO')}</time>
              {post.readingTime && <><span>•</span><span>{post.readingTime}</span></>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 mt-8 grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Article */}
        <article className="prose prose-neutral max-w-3xl">
          {/* Badge */}
          {post.category && (
            <div className="mb-4"><span className="chip">{post.category}</span></div>
          )}
          {/* Rich content */}
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p>Conținutul articolului va fi disponibil în curând.</p>
          )}
          {/* CTA */}
          <div className="mt-8 p-5 rounded-xl border border-line bg-bgsoft">
            <div className="font-medium mb-2">Îți plac ghidurile noastre?</div>
            <p className="text-ink/70 mb-3">Abonează-te pentru a primi analize și tendințe de la experți în aranjamente florale.</p>
            <a href="#newsletter" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition">Abonează-mă</a>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </article>
        {/* Sidebar */}
        <div className="space-y-6">
          <TOC />
          <div className="p-4 rounded-xl border border-line bg-white">
            <div className="font-medium mb-2">Articole populare</div>
            <div className="grid gap-3">
              {POSTS.slice(0,3).map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} className="block text-sm text-ink/80 hover:text-primary">
                  {p.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ShareBar url={url} title={post.title} />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h3 className="text-xl font-semibold mb-4">Articole similare</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {POSTS.filter(p=>p.slug!==post.slug).slice(0,3).map(p=> <PostCard key={p.slug} {...p} />)}
        </div>
      </section>
    </div>
  );
}

