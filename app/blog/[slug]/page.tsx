import React from "react";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { PostMetaBar } from "@/components/blog/PostMetaBar";
import { ShareBar } from "@/components/blog/ShareBar";
import { TOC } from "@/components/blog/TOC";
import { POSTS, getPostBySlug } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const url = `https://floristmarket.ro/blog/${post.slug}`;
  return (
    <div>
      <ReadingProgress />
      <PostMetaBar title={post.title} date={post.date} readingTime={post.readingTime} author={post.author} />
      <div className="mx-auto max-w-5xl px-4 mt-8 grid lg:grid-cols-[1fr_280px] gap-10">
        <article className="prose prose-neutral max-w-3xl">
          <div className="rounded-2xl overflow-hidden border border-line bg-bgsoft aspect-[16/9] mb-6">
            {post.cover && <img src={post.cover} alt={post.title} className="h-full w-full object-cover" />}
          </div>
          <p>
            Acesta este un corp de articol demonstrativ. În proiectul real, conținutul va fi randat din MDX
            cu stilizare <em>prose</em> și componente custom (Card, Callout, Gallery).
          </p>
          <h2>Idei cheie</h2>
          <ul>
            <li>Palete naturale: verde închis, crem, bej.</li>
            <li>Texturi: ceramică mată, hârtie kraft, textile simple.</li>
            <li>Forme: cutii rotunde, coloane înalte, geometrii curate.</li>
          </ul>
          <h2>Exemple rapide</h2>
          <p>Combină ghivece ceramice albe cu panglică verde închis pentru un efect premium minimalist.</p>
        </article>
        <TOC />
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

