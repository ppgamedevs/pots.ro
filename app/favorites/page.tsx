import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/session';
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Produsele mele favorite - FloristMarket.ro",
  description: "Vezi produsele tale favorite pe FloristMarket.ro",
};

export default async function FavoritesPage() {
  await requireAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                FloristMarket.ro
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Înapoi la site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/account" 
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la contul meu
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Produsele mele favorite
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Produsele pe care le-ai salvat pentru mai târziu
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Nu ai produse favorite încă
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Începe să explorezi produsele noastre și salvează-ți favoritele pentru mai târziu.
            </p>
            <Link 
              href="/c"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Heart className="h-4 w-4" />
              Descoperă produse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
