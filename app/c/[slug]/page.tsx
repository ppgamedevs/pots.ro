"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductGrid } from "@/components/ui/product-grid";
import { FilterChips } from "@/components/ui/filter-chips";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { H1, H2, P } from "@/components/ui/typography";
import { stagger, fadeInUp } from "@/components/motion";
import { X, Filter, SortAsc } from "lucide-react";

// Mock data
const categories = {
  "ghivece": {
    title: "Ghivece",
    description: "Ghivece de calitate pentru toate tipurile de plante. Materiale durabile și design modern.",
    products: [
      { id: 1, slug: "ghiveci-ceramic-alb", title: "Ghiveci ceramic alb", price: 49.9, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
      { id: 2, slug: "ghiveci-teracota-mic", title: "Ghiveci teracotă mic", price: 29.9, imageUrl: "/placeholder.svg", sellerSlug: "ceramic-art" },
      { id: 3, slug: "ghiveci-plastic-verde", title: "Ghiveci plastic verde", price: 19.9, imageUrl: "/placeholder.svg", sellerSlug: "garden-supplies" },
      { id: 4, slug: "ghiveci-metal-auriu", title: "Ghiveci metal auriu", price: 79.9, imageUrl: "/placeholder.svg", sellerSlug: "luxury-pots" },
      { id: 5, slug: "ghiveci-ceramic-marime-mare", title: "Ghiveci ceramic mărime mare", price: 89.9, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
      { id: 6, slug: "ghiveci-bambus-ecologic", title: "Ghiveci bambus ecologic", price: 39.9, imageUrl: "/placeholder.svg", sellerSlug: "eco-garden" },
    ]
  },
  "cutii": {
    title: "Cutii",
    description: "Cutii elegante pentru aranjamente florale și cadouri. Design clasic și modern.",
    products: [
      { id: 7, slug: "cutie-inalta-nevopsita", title: "Cutie înaltă natur", price: 79.0, imageUrl: "/placeholder.svg", sellerSlug: "cardboard-street" },
      { id: 8, slug: "cutie-patrata-alba", title: "Cutie pătrată albă", price: 45.0, imageUrl: "/placeholder.svg", sellerSlug: "paper-craft" },
      { id: 9, slug: "cutie-rotunda-aurie", title: "Cutie rotundă aurie", price: 65.0, imageUrl: "/placeholder.svg", sellerSlug: "luxury-boxes" },
    ]
  },
  "accesorii": {
    title: "Accesorii",
    description: "Accesorii esențiale pentru aranjamente florale. Panglici, vaze, suporturi și multe altele.",
    products: [
      { id: 10, slug: "panglica-satin", title: "Panglică satin 25mm", price: 14.5, imageUrl: "/placeholder.svg", sellerSlug: "accesorii-florale" },
      { id: 11, slug: "vaza-cristal-mica", title: "Vază cristal mică", price: 35.0, imageUrl: "/placeholder.svg", sellerSlug: "crystal-vases" },
      { id: 12, slug: "suport-flori-metal", title: "Suport flori metal", price: 25.0, imageUrl: "/placeholder.svg", sellerSlug: "metal-accessories" },
    ]
  }
};

const sortOptions = [
  { value: "newest", label: "Cele mai noi" },
  { value: "price-asc", label: "Preț crescător" },
  { value: "price-desc", label: "Preț descrescător" },
  { value: "name-asc", label: "Nume A-Z" },
  { value: "name-desc", label: "Nume Z-A" },
];

const filterOptions = {
  material: [
    { value: "ceramic", label: "Ceramic" },
    { value: "plastic", label: "Plastic" },
    { value: "metal", label: "Metal" },
    { value: "bambus", label: "Bambus" },
    { value: "teracota", label: "Teracotă" },
  ],
  price: [
    { value: "0-25", label: "Sub 25 RON" },
    { value: "25-50", label: "25-50 RON" },
    { value: "50-100", label: "50-100 RON" },
    { value: "100+", label: "Peste 100 RON" },
  ],
  seller: [
    { value: "atelier-ceramic", label: "Atelier Ceramic" },
    { value: "garden-supplies", label: "Garden Supplies" },
    { value: "luxury-pots", label: "Luxury Pots" },
    { value: "eco-garden", label: "Eco Garden" },
  ]
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const category = categories[params.slug as keyof typeof categories];
  
  if (!category) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <EmptyState
            variant="category"
            title="Categorie nu există"
            description="Categoria pe care o căutați nu există sau a fost mutată."
            action={{
              label: "Vezi toate categoriile",
              onClick: () => window.location.href = "/",
            }}
          />
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: "Categorii", href: "/c" },
    { label: category.title, href: `/c/${params.slug}` },
  ];

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType]?.includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...(prev[filterType] || []), value]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-4"
          >
            <H1>{category.title}</H1>
            <P className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
              {category.description}
            </P>
          </motion.div>

          {/* Filters and Sort */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtre
                  {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {Object.values(filters).reduce((acc, arr) => acc + arr.length, 0)}
                    </Badge>
                  )}
                </Button>
                
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Șterge filtrele
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-slate-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sortează după" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Chips */}
            <FilterChips
              filters={filters}
              filterOptions={filterOptions}
              onFilterRemove={handleFilterChange}
              onClearAll={clearFilters}
            />

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-slate-900/60"
              >
                <div className="grid gap-6 md:grid-cols-3">
                  {Object.entries(filterOptions).map(([filterType, options]) => (
                    <div key={filterType}>
                      <H2 className="text-sm font-semibold mb-3 capitalize">
                        {filterType === "material" ? "Material" : 
                         filterType === "price" ? "Preț" : "Vânzător"}
                      </H2>
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters[filterType]?.includes(option.value) || false}
                              onChange={() => handleFilterChange(filterType, option.value)}
                              className="rounded border-slate-300 text-brand focus:ring-brand"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Products Grid */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {category.products.length} produse găsite
              </p>
            </div>

            {category.products.length > 0 ? (
              <>
                <ProductGrid products={category.products} columns={4} />

                {/* Pagination */}
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(category.products.length / 12)}
                    onPageChange={setCurrentPage}
                    showFirstLast={true}
                    maxVisiblePages={5}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                variant="search"
                title="Nu am găsit produse"
                description="Încearcă să modifici filtrele pentru a vedea mai multe rezultate."
                action={{
                  label: "Resetează filtrele",
                  onClick: clearFilters,
                }}
              />
            )}
          </motion.section>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
