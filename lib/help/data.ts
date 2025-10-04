export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  keywords: string[];
  file: string; // path către markdown în /content/help
};

export const HELP_CATEGORIES = [
  { id: "cum-incep", title: "Începe aici" },
  { id: "comenzi", title: "Comenzi" },
  { id: "livrare", title: "Livrare" },
  { id: "retururi", title: "Retururi & anulări" },
  { id: "plati", title: "Plăți & facturi" },
  { id: "vanzatori", title: "Vânzători" },
  { id: "legal", title: "Legal" },
] as const;

export const ARTICLES: HelpArticle[] = [
  {
    slug: "ghid-rapid",
    category: "cum-incep",
    title: "Ghid rapid FloristMarket",
    excerpt: "Creează cont, descoperă produse și plasează prima comandă.",
    keywords: ["ghid", "cont", "cum folosesc"],
    file: "content/help/getting-started.md"
  },
  {
    slug: "despre-comenzi",
    category: "comenzi",
    title: "Comenzi: de la coș la plată",
    excerpt: "Pașii de comandă, statusuri și notificări.",
    keywords: ["comandă", "status", "plată"],
    file: "content/help/orders.md"
  },
  {
    slug: "expediere",
    category: "livrare",
    title: "Livrare & AWB",
    excerpt: "Curieri, termene estimate, urmărire colet.",
    keywords: ["livrare", "awb", "curieri"],
    file: "content/help/shipping.md"
  },
  {
    slug: "retururi",
    category: "retururi",
    title: "Retur & anulări",
    excerpt: "Condiții, solicitare, aprobare și rambursare.",
    keywords: ["retur", "anulare", "refund"],
    file: "content/help/returns.md"
  },
  {
    slug: "plati",
    category: "plati",
    title: "Plăți & facturi",
    excerpt: "Metode de plată, facturi automate, securitate.",
    keywords: ["plată", "factură", "netopia"],
    file: "content/help/payments.md"
  },
  {
    slug: "vanzatori",
    category: "vanzatori",
    title: "Ghid vânzători",
    excerpt: "Setări magazin, produse, livrare, încasări.",
    keywords: ["seller", "payout", "produse"],
    file: "content/help/sellers.md"
  },
  {
    slug: "confidentialitate",
    category: "legal",
    title: "Politica de confidențialitate",
    excerpt: "Cum prelucrăm datele personale.",
    keywords: ["gdpr", "privacy"],
    file: "content/help/privacy.md"
  },
  {
    slug: "termeni",
    category: "legal",
    title: "Termeni și condiții",
    excerpt: "Termenii platformei.",
    keywords: ["legal", "termeni"],
    file: "content/help/terms.md"
  },
  {
    slug: "cookies",
    category: "legal",
    title: "Politica Cookies",
    excerpt: "Ce cookie-uri folosim și de ce.",
    keywords: ["cookies"],
    file: "content/help/cookies.md"
  },
];

export function searchHelp(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return ARTICLES.filter(a =>
    a.title.toLowerCase().includes(s) ||
    a.excerpt.toLowerCase().includes(s) ||
    a.keywords.some(k => k.includes(s))
  ).slice(0, 8);
}
