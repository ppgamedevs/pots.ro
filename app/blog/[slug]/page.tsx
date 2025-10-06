import React from "react";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { PostMetaBar } from "@/components/blog/PostMetaBar";
import { ShareBar } from "@/components/blog/ShareBar";
import { TOC } from "@/components/blog/TOC";
import { POSTS, getPostBySlug, getPostContent } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const url = `https://pots.ro/blog/${post.slug}`;
  const html = getPostContent(post.slug);
  return (
    <div>
      <ReadingProgress />
      <PostMetaBar title={post.title} date={post.date} readingTime={post.readingTime} author={post.author} />
      <div className="mx-auto max-w-6xl px-4 mt-8 grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Article */}
        <article className="prose prose-neutral max-w-3xl">
          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden border border-line bg-bgsoft aspect-[16/9] mb-6">
            {post.cover && <img src={post.cover} alt={post.title} className="h-full w-full object-cover" />}
            {/* Badge */}
            {post.category && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-line">
                {post.category}
              </span>
            )}
          </div>
          {/* Rich content */}
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p>Conținutul articolului va fi disponibil în curând.</p>
          )}
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

