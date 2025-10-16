import { ARTICLES, HELP_CATEGORIES } from "@/lib/help/data";
import Link from "next/link";
import BackHome from "@/components/common/BackHome";
import { HelpCard } from "@/components/help/HelpCard";

interface HelpCategoryProps {
  params: { category: string };
}

export default function HelpCategory({ params }: HelpCategoryProps) {
  const cat = HELP_CATEGORIES.find(c => c.id === params.category);
  const items = ARTICLES.filter(a => a.category === params.category);
  
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <BackHome />
      <h1 className="text-2xl font-semibold text-ink">
        {cat?.title ?? "Help"}
      </h1>
      
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {items.map(a => (
          <HelpCard key={a.slug} article={a} showCategory={false} />
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted">Nu există articole în această categorie.</p>
        </div>
      )}
    </main>
  );
}
