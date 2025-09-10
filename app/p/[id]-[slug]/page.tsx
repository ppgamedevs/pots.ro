"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { H1, H2, H3, P, Lead } from "@/components/ui/typography";
import { useToast } from "@/lib/hooks/use-toast";
import { stagger, fadeInUp } from "@/components/motion";
import { ProductPageSkeleton } from "@/components/ui/loading-skeletons";
import { ProductErrorState } from "@/components/ui/error-states";
import { ProductStructuredData } from "@/components/seo/structured-data";
import { Heart, Share2, Truck, Shield, RotateCcw, Star, MapPin } from "lucide-react";

// Mock data
const products = {
  "1-ghiveci-ceramic-alb": {
    id: 1,
    title: "Ghiveci ceramic alb",
    price: 49.9,
    originalPrice: 69.9,
    currency: "RON",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center", 
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center",
    ],
    description: "Ghiveci ceramic alb de calitate superioară, perfect pentru plante de interior. Design modern și elegant care se potrivește în orice decor. Materialul ceramic oferă izolație termică excelentă și menține umiditatea optimă pentru rădăcini.",
    specifications: {
      "Material": "Ceramic smălțuit",
      "Dimensiuni": "15cm x 15cm x 12cm",
      "Greutate": "850g",
      "Culoare": "Alb",
      "Tip": "Pentru interior",
      "Drenaj": "Găuri de drenaj incluse"
    },
    seller: {
      slug: "atelier-ceramic",
      name: "Atelier Ceramic",
      rating: 4.8,
      reviews: 127,
      location: "București",
      verified: true,
      description: "Specializați în ceramică artizanală de calitate superioară. Peste 10 ani de experiență în crearea de ghivece unice și durabile."
    },
    rating: 4.7,
    reviews: 89,
    inStock: true,
    stock: 15,
    category: "ghivece",
    tags: ["ceramic", "alb", "interior", "modern"]
  },
  "2-cutie-inalta-nevopsita": {
    id: 2,
    title: "Cutie înaltă natur",
    price: 79.0,
    currency: "RON",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center",
    ],
    description: "Cutie înaltă din carton reciclat, perfectă pentru aranjamente florale înalte. Design clasic și elegant, ideală pentru cadouri și evenimente speciale. Materialul natural oferă o estetică rustică și eco-friendly.",
    specifications: {
      "Material": "Carton reciclat",
      "Dimensiuni": "25cm x 25cm x 40cm",
      "Greutate": "200g",
      "Culoare": "Natur (bej)",
      "Tip": "Pentru aranjamente",
      "Rezistență": "Umiditate moderată"
    },
    seller: {
      slug: "cardboard-street",
      name: "Cardboard Street",
      rating: 4.6,
      reviews: 89,
      location: "Cluj-Napoca",
      verified: true,
      description: "Producători de cutii și ambalaje eco-friendly. Ne specializăm în soluții creative și durabile pentru industria florală."
    },
    rating: 4.5,
    reviews: 34,
    inStock: true,
    stock: 8,
    category: "cutii",
    tags: ["carton", "natur", "eco", "cadou"]
  }
};


export default function ProductPage({ params }: { params: { id: string; slug: string } }) {
  const { showAddToCart, showError } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productId = `${params.id}-${params.slug}`;
  const product = products[productId as keyof typeof products];

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <ProductErrorState id={params.id} />
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: "Categorii", href: "/c" },
    { label: product.category === "ghivece" ? "Ghivece" : product.category === "cutii" ? "Cutii" : "Accesorii", href: `/c/${product.category}` },
    { label: product.title, href: `/p/${productId}` },
  ];

  const handleAddToCart = () => {
    if (product.inStock) {
      showAddToCart(product.title);
    } else {
      showError("Produsul nu este disponibil în stoc");
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const discountPercentage = 'originalPrice' in product && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <ProductStructuredData product={product} />
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

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Gallery */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
                <OptimizedImage
                  src={product.images[selectedImage]}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-brand"
                        : "border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <OptimizedImage
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      sizes="80px"
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info & Buy Box */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              {/* Product Header */}
              <div className="space-y-4">
                <H1 className="text-3xl font-bold">{product.title}</H1>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {product.rating} ({product.reviews} recenzii)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {product.price.toFixed(2)} {product.currency}
                  </span>
                  {'originalPrice' in product && product.originalPrice && (
                    <span className="text-xl text-slate-500 line-through">
                      {product.originalPrice.toFixed(2)} {product.currency}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={product.inStock ? "success" : "destructive"}>
                    {product.inStock ? `În stoc (${product.stock})` : "Stoc epuizat"}
                  </Badge>
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sticky Buy Box */}
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Cumpără acum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                    >
                      {product.inStock ? "Adaugă în coș" : "Stoc epuizat"}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={handleWishlist}
                        className="flex items-center gap-2"
                      >
                        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                        Lista dorințelor
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Partajează
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Livrare gratuită peste 200 RON</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Garanție 2 ani</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      <span>Retur gratuit în 30 zile</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Product Details */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-8 lg:grid-cols-3"
          >
            {/* Description */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <H2>Descriere</H2>
                <P className="mt-2">{product.description}</P>
              </div>

              <div>
                <H2>Specificații</H2>
                <div className="mt-4 grid gap-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-200 dark:border-white/10">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{key}</span>
                      <span className="text-slate-600 dark:text-slate-400">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vândut de</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {product.seller.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.seller.name}</span>
                        {product.seller.verified && (
                          <Badge variant="success" className="text-xs">Verificat</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.seller.rating}</span>
                        <span>({product.seller.reviews} recenzii)</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span>{product.seller.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <P className="text-sm">{product.seller.description}</P>
                  
                  <Button variant="outline" className="w-full">
                    Vezi toate produsele
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
