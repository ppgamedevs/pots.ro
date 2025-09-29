"use client";
import { useState } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { UITabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { stagger, fadeInUp } from "@/components/motion";

export default function UIDemoPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const breadcrumbItems = [
    { name: "Acasă", href: "/" },
    { name: "Ghivece", href: "/c/ghivece" },
    { name: "Ceramică albă", href: "/ui-demo" },
  ];

  const tabs = [
    {
      value: "products",
      label: "Produse",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Produse disponibile</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3"></div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Produs {i}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">Descriere produs</p>
                <p className="text-lg font-semibold text-brand mt-2">49.90 RON</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      value: "about",
      label: "Despre",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Despre vânzător</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Contact</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">email@example.com</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">+40 123 456 789</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Livrare</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">În toată țara</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">1-3 zile lucrătoare</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "reviews",
      label: "Recenzii",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recenzii clienți</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-brand rounded-full"></div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Client {i}</p>
                    <div className="flex text-yellow-400">
                      {"★".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Produs foarte bun, calitate excelentă. Recomand!
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">UI Components Demo</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Breadcrumbs, Tabs, și Pagination cu Tailwind + Dark Mode
            </p>
          </motion.div>

          {/* Breadcrumbs Demo */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Breadcrumbs</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <Breadcrumbs items={breadcrumbItems} />
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Navigație ierarhică cu link-uri interactive și aria-current="page" pe ultimul element.
              </p>
            </div>
          </motion.section>

          {/* Tabs Demo */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tabs</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <UITabs
                defaultValue="products"
                tabs={tabs}
              />
            </div>
          </motion.section>

          {/* Pagination Demo */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pagination</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pagina curentă: <span className="font-medium text-brand">{currentPage}</span> din {totalPages}
                </p>
              </div>
              <Pagination 
                totalPages={totalPages} 
                currentPage={currentPage}
                ariaLabel="Demo pagination"
              />
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Următor →
                </button>
              </div>
            </div>
          </motion.section>

          {/* Features List */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Caracteristici</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Accessibility</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• aria-current="page" pe breadcrumbs</li>
                  <li>• Keyboard navigation pentru tabs</li>
                  <li>• Screen reader support</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Dark Mode</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Styling consistent</li>
                  <li>• Contrast optimizat</li>
                  <li>• Tranziții smooth</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Performance</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• URL preservation</li>
                  <li>• Hover effects</li>
                  <li>• Focus states</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
