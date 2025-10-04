import HelpSearch from "@/components/help/HelpSearch";
import { HELP_CATEGORIES } from "@/lib/help/data";
import Link from "next/link";

export default function HelpIndex() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-ink">Help Center</h1>
      <p className="text-ink/70 mt-2">
        Răspunsuri rapide pentru comenzile, livrările și vânzările tale.
      </p>
      
      <div className="mt-6">
        <HelpSearch />
      </div>
      
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-ink">Categorii</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {HELP_CATEGORIES.map(c => (
            <Link 
              key={c.id} 
              href={`/help/${c.id}`} 
              className="rounded-lg border border-line p-4 hover:shadow-card transition-micro text-center"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}