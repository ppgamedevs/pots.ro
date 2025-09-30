<<<<<<< HEAD
export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to Pots.ro
      </h1>
      <p className="text-center text-gray-600">
        A modern web application for pot management and tracking.
      </p>
    </main>
  );
}
=======
"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { stagger, fadeInUp } from "@/components/motion";
import { WebsiteStructuredData } from "@/components/seo/structured-data";

const demo = [
  { 
    id: 1, 
    slug: "ghiveci-ceramic-alb", 
    title: "Ghiveci ceramic alb", 
    price: 4990, // price in cents
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center", 
    sellerSlug: "atelier-ceramic",
    attributes: {
      price_cents: 4990,
      stock_qty: 15,
      is_in_stock: true,
      vendor_id: 1,
      material: "ceramic" as const,
      color: "white" as const,
      shape: "round" as const,
      style: "modern" as const,
      finish: "matte" as const,
      diameter_mm: 200,
      height_mm: 150,
      drainage_hole: true,
      saucer_included: false,
      indoor_outdoor: "indoor",
      personalizable: false,
      painted: false,
      tags: ["ceramic", "white", "modern"],
      ribbon_included: false,
      created_at: new Date().toISOString(),
      popularity_score: 850,
    }
  },
  { 
    id: 2, 
    slug: "cutie-inalta-nevopsita", 
    title: "Cutie înaltă natur", 
    price: 7900, 
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center", 
    sellerSlug: "cardboard-street",
    attributes: {
      price_cents: 7900,
      stock_qty: 8,
      is_in_stock: true,
      vendor_id: 2,
      material: "cardboard" as const,
      color: "natural" as const,
      shape: "rectangle" as const,
      style: "rustic" as const,
      finish: "matte" as const,
      length_mm: 300,
      height_mm: 400,
      tall_or_normal: "tall",
      painted: false,
      personalizable: true,
      tags: ["cardboard", "natural", "rustic"],
      ribbon_included: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      popularity_score: 720,
    }
  },
  { 
    id: 3, 
    slug: "panglica-satin", 
    title: "Panglică satin 25mm", 
    price: 1450, 
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&crop=center", 
    sellerSlug: "accesorii-florale",
    attributes: {
      price_cents: 1450,
      stock_qty: 25,
      is_in_stock: true,
      vendor_id: 3,
      material: "textile" as const,
      color: "natural" as const,
      style: "classic" as const,
      finish: "satin" as const,
      pack_units: 10,
      compatibility: ["bouquet", "box"],
      personalizable: false,
      painted: false,
      tags: ["textile", "natural", "classic"],
      ribbon_included: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      popularity_score: 650,
    }
  },
];

export default function Home() {
  return (
    <>
      <WebsiteStructuredData 
        name="Pots.ro" 
        description="Cutii, ghivece, accesorii — tot ce ai nevoie, într-un singur loc." 
        url="https://pots.ro" 
      />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-8 text-center shadow-soft hover:shadow-soft transition-all duration-200 hover:-translate-y-[1px]"
        >
          <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl">
            <Image
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=600&fit=crop&crop=center"
              alt="Pots.ro - Marketplace românesc pentru floristică"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              className="object-cover"
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Pots.ro - Marketplace românesc pentru floristică</h1>
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
              <ProductCard 
                id={p.id}
                slug={p.slug}
                title={p.title}
                price={p.price}
                currency="RON"
                imageUrl={p.imageUrl}
                sellerSlug={p.sellerSlug}
                attributes={p.attributes}
              />
            </motion.div>
          ))}
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
>>>>>>> main
