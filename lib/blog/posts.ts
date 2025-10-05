export type PostFrontMatter = {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string; // ISO
  category?: string;
  tags?: string[];
  author?: { name: string; avatar?: string };
  readingTime?: string;
};

export const POSTS: PostFrontMatter[] = [
  {
    slug: "trenduri-florale-2026",
    title: "Trenduri florale 2026: minimal, natural, texturi",
    excerpt: "Ce se poartă în floristică anul viitor: palete naturale, cutii geometrice și mixuri sustenabile.",
    cover: "/images/blog1.jpg",
    date: "2025-08-01",
    category: "Inspirație",
    author: { name: "Echipa FloristMarket", avatar: "/images/avatar-fm.png" },
    readingTime: "4 min",
  },
  {
    slug: "ghid-cutii-dimensionare",
    title: "Cum alegi cutia potrivită după dimensiuni",
    excerpt: "Reguli simple pentru a potrivi florile cu cutiile—fără risipă și fără surprize.",
    cover: "/images/blog2.jpg",
    date: "2025-07-15",
    category: "Ghiduri",
    author: { name: "Echipa FloristMarket", avatar: "/images/avatar-fm.png" },
    readingTime: "6 min",
  },
  {
    slug: "vitrina-de-sezon",
    title: "Vitrina de sezon: 5 idei rapide",
    excerpt: "Patru materiale, un efect mare: textile, panglici, suporturi înalte, lumină caldă.",
    cover: "/images/blog3.jpg",
    date: "2025-06-20",
    category: "Inspirație",
    author: { name: "Echipa FloristMarket", avatar: "/images/avatar-fm.png" },
    readingTime: "3 min",
  },
];

export function getPostBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}


