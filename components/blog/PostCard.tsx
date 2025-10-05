import React from "react";

export type PostCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;
  readingTime?: string;
  category?: string;
  author?: { name: string; avatar?: string };
};

export function PostCard(p: PostCardProps) {
  return (
    <a href={`/blog/${p.slug}`} className="group rounded-2xl border border-line overflow-hidden bg-white hover:shadow-card transition-shadow">
      <div className="aspect-[16/9] bg-bgsoft overflow-hidden">
        <img src={p.cover || "/images/blog-cover.jpg"} alt={p.title} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      </div>
      <div className="p-5">
        <div className="text-xs text-muted flex items-center gap-2">
          {p.category && <span className="chip">{p.category}</span>}
          <time dateTime={p.date}>{new Date(p.date).toLocaleDateString("ro-RO")}</time>
          {p.readingTime && <span>• {p.readingTime}</span>}
        </div>
        <h3 className="mt-2 text-ink font-semibold text-lg line-clamp-2">{p.title}</h3>
        <p className="mt-2 text-sm text-ink/70 line-clamp-3">{p.excerpt}</p>
        <div className="mt-4 text-sm text-primary">Citește articolul →</div>
      </div>
    </a>
  );
}


