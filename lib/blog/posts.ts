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
    slug: "ghivece-ceramice-premium-romania-2025",
    title: "Ghivece Ceramice Premium România 2025: Ghid Complet pentru Alegerea Perfectă",
    excerpt: "Descoperă cele mai bune ghivece ceramice din România pentru 2025. Ghid expert cu teste de calitate, materiale premium și sfaturi de specialiști pentru alegerea ghiveciului ideal pentru plantele tale.",
    cover: "/blog/ghivece-ceramice-premium-2025.jpg",
    date: "2025-01-15",
    category: "Ghiduri Expert",
    author: { name: "Dr. Maria Popescu - Expert Botanică", avatar: "/images/avatar-expert-1.png" },
    readingTime: "8 min",
    tags: ["ghivece ceramice", "romania", "2025", "plante interioare", "ghid expert", "calitate premium"]
  },
  {
    slug: "tendinte-design-floral-romania-2025",
    title: "Tendințe Design Floral România 2025: Minimalism Japonez și Tehnologie Smart",
    excerpt: "Cele mai noi tendințe în designul floral pentru România în 2025. Minimalism japonez, ghivece smart cu tehnologie IoT, culori tropicale și stiluri moderne pentru casa românească.",
    cover: "/blog/tendinte-design-floral-2025.jpg",
    date: "2025-01-10",
    category: "Tendințe 2025",
    author: { name: "Alexandru Ionescu - Designer Floral", avatar: "/images/avatar-expert-2.png" },
    readingTime: "10 min",
    tags: ["design floral", "romania", "2025", "minimalism japonez", "ghivece smart", "trenduri"]
  },
  {
    slug: "ingrijire-plante-interioare-romania-2025",
    title: "Îngrijire Plante Interioare România 2025: Sistem Complet pentru Clima Locală",
    excerpt: "Ghid expert pentru îngrijirea plantelor interioare în România în 2025. Adaptare la clima locală, sisteme de irigație automată, controlul umidității și protecția împotriva dăunătorilor.",
    cover: "/blog/ingrijire-plante-interioare-2025.jpg",
    date: "2025-01-05",
    category: "Îngrijire Expertă",
    author: { name: "Prof. Ana Maria - Specialist Horticultură", avatar: "/images/avatar-expert-3.png" },
    readingTime: "12 min",
    tags: ["plante interioare", "romania", "2025", "îngrijire", "clima locală", "sistem automat"]
  },
];

export function getPostBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}


