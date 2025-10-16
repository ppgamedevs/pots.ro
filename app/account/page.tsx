import { Metadata } from "next";
import Link from "next/link";
import { User, ShoppingBag, Heart, Settings } from "lucide-react";
import { requireAuth, getCurrentUser } from '@/lib/auth/session';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Contul meu - FloristMarket.ro",
  description: "Gestionează contul tău și comenzile pe FloristMarket.ro",
};

export default async function MyAccountPage() {
  await requireAuth();
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Eroare la încărcarea utilizatorului</div>;
  }

  // Get user data with displayId and createdAt
  const userData = await db
    .select({
      displayId: users.displayId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const userInfo = userData[0];
  
  // Format registration date
  const formatRegistrationDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Astăzi";
    if (diffDays === 2) return "Ieri";
    if (diffDays <= 7) return `${diffDays} zile`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} săptămâni`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} luni`;
    return `${Math.ceil(diffDays / 365)} ani`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Contul meu
                </h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/comenzi"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Comenzile mele
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/favorite"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                      Lista de dorințe
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/setari"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      Setări
                    </Link>
                  </li>
                  <li>
                    <LogoutButton />
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Bun venit în contul tău!
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Gestionează informațiile personale, comenzile și preferințele din acest panou.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/comenzi"
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        Comenzile mele
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Vezi istoricul comenzilor și statusul lor
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/favorite"
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        Lista de dorințe
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Produsele pe care le-ai salvat pentru mai târziu
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Comenzi totale
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    0
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Comenzi plasate
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Produse favorite
                  </h3>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    0
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    În lista de dorințe
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Membru din
                  </h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {userInfo ? formatRegistrationDate(userInfo.createdAt) : "Astăzi"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Data înregistrării
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
