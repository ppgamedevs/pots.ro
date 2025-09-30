import { Search, Filter, Grid3X3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type EmptyStateProps = {
  type: "category" | "search";
  onResetFilters?: () => void;
  searchQuery?: string;
};

export function EmptyState({ type, onResetFilters, searchQuery }: EmptyStateProps) {
  if (type === "category") {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Grid3X3 className="h-12 w-12 text-slate-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          N-am găsit produse
        </h3>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Nu există produse în această categorie momentan. Încearcă să resetezi filtrele sau explorează alte categorii.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onResetFilters && (
            <Button
              onClick={onResetFilters}
              variant="outline"
              className="btn btn-ghost"
            >
              <Filter className="h-4 w-4 mr-2" />
              Resetează filtre
            </Button>
          )}
          
          <Link href="/c" className="btn btn-primary">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Vezi toate categoriile
          </Link>
        </div>
      </div>
    );
  }

  if (type === "search") {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Search className="h-12 w-12 text-slate-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Nu am găsit rezultate
        </h3>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          {searchQuery ? (
            <>Nu am găsit produse pentru "{searchQuery}". Încearcă alți termeni de căutare.</>
          ) : (
            "Încearcă alți termeni de căutare sau explorează categoriile noastre."
          )}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="btn btn-ghost"
          >
            <Search className="h-4 w-4 mr-2" />
            Încearcă alți termeni
          </Button>
          
          <Link href="/contact" className="btn btn-primary">
            <Mail className="h-4 w-4 mr-2" />
            Contactează-ne
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
