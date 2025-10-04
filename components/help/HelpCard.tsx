import Link from "next/link";
import { HelpArticle } from "@/lib/help/data";

interface HelpCardProps {
  article: HelpArticle;
  showCategory?: boolean;
}

export function HelpCard({ article, showCategory = true }: HelpCardProps) {
  return (
    <Link 
      href={`/help/${article.category}/${article.slug}`} 
      className="block rounded-lg border border-line p-4 hover:shadow-card transition-micro"
    >
      {showCategory && (
        <div className="text-sm text-muted capitalize mb-1">
          {article.category.replace('-', ' ')}
        </div>
      )}
      <div className="font-medium">{article.title}</div>
      <div className="text-sm text-ink/70 mt-1 line-clamp-2">{article.excerpt}</div>
    </Link>
  );
}
