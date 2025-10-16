import { ARTICLES } from "@/lib/help/data";
import BackHome from "@/components/common/BackHome";
import fs from "node:fs";
import path from "path";

interface HelpArticlePageProps {
  params: { category: string; slug: string };
}

export default function HelpArticlePage({ params }: HelpArticlePageProps) {
  const article = ARTICLES.find(x => x.category === params.category && x.slug === params.slug);
  
  let body = "Articolul nu există.";
  
  if (article) {
    try {
      const filePath = path.join(process.cwd(), article.file);
      body = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      console.error("Error reading article file:", error);
      body = "Eroare la încărcarea articolului.";
    }
  }
  
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <BackHome />
      
      <article className="prose prose-neutral max-w-none">
        <h1 className="text-3xl font-semibold text-ink mb-6">
          {article?.title ?? "Articol"}
        </h1>
        
        <div className="text-ink whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      </article>
    </main>
  );
}
