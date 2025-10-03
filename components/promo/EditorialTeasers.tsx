"use client";

import Link from "next/link";
import Image from "next/image";

export interface EditorialPost {
  title: string;
  image: {
    src: string;
    alt: string;
  };
  href: string;
  readTime: string;
}

export interface EditorialTeasersProps {
  posts: EditorialPost[];
}

export function EditorialTeasers({ posts }: EditorialTeasersProps) {
  return (
    <section className="py-8 lg:py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-ink mb-2">Ghiduri și inspirații</h2>
          <p className="text-muted">Descoperă sfaturi și tendințe din lumea floristicii</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <Link 
              key={index}
              href={post.href}
              className="group block bg-bg border border-line rounded-lg overflow-hidden transition-micro hover:shadow-card"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.image.src}
                  alt={post.image.alt}
                  fill
                  className="object-cover transition-micro group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-ink mb-2 line-clamp-2 group-hover:text-primary transition-micro">
                  {post.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{post.readTime} de citire</span>
                  <span className="group-hover:text-primary transition-micro">
                    Citește mai mult →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
