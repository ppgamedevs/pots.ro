"use client";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { stagger, fadeInUp } from "@/components/motion";

const demo = [
  { id: 1, slug: "ghiveci-ceramic-alb", title: "Ghiveci ceramic alb", price: 49.9, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
  { id: 2, slug: "cutie-inalta-nevopsita", title: "Cutie înaltă natur", price: 79.0, imageUrl: "/placeholder.svg", sellerSlug: "cardboard-street" },
  { id: 3, slug: "panglica-satin", title: "Panglică satin 25mm", price: 14.5, imageUrl: "/placeholder.svg", sellerSlug: "accesorii-florale" },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-8 text-center shadow-soft hover:shadow-soft transition-all duration-200 hover:-translate-y-[1px]"
        >
          <h1 className="text-2xl md:text-3xl font-semibold">Marketplace românesc pentru floristică</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Cutii, ghivece, accesorii — tot ce ai nevoie, într-un singur loc.</p>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"
        >
          {demo.map((p) => (
            <motion.div key={p.id} variants={fadeInUp}>
              <ProductCard {...p} />
            </motion.div>
          ))}
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
