import { Metadata } from "next";
import Link from "next/link";
import { Package, BarChart3, Settings, Users, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - Pots.ro",
  description: "Panoul de control pentru vânzători pe Pots.ro",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Meniu
                </h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/dashboard/products"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Package className="h-5 w-5" />
                      Produsele mele
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/analytics"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <BarChart3 className="h-5 w-5" />
                      Analiză
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/orders"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Users className="h-5 w-5" />
                      Comenzi
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/about"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileText className="h-5 w-5" />
                      Pagina About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      Setări
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
