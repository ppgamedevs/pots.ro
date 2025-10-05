import React from "react";
import { POSTS } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";

export const revalidate = 60;

export default function BlogCategoryPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const items = POSTS.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{category}</h1>
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {items.map(p=> <PostCard key={p.slug} {...p} />)}
      </div>
    </main>
  );
}


