"use client";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UITabs } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { H1, H2, H3, P, Lead } from "@/components/ui/typography";
import { stagger, fadeInUp } from "@/components/motion";
import { Star, MapPin, Calendar, Award, Users, Package, MessageCircle } from "lucide-react";

// Mock data
const sellers = {
  "atelier-ceramic": {
    name: "Atelier Ceramic",
    slug: "atelier-ceramic",
    description: "Specializați în ceramică artizanală de calitate superioară. Peste 10 ani de experiență în crearea de ghivece unice și durabile.",
    longDescription: "Atelier Ceramic este o afacere de familie cu o tradiție de peste 10 ani în producerea ceramicii artizanale. Ne specializăm în crearea de ghivece unice, vaze și accesorii pentru grădină, toate realizate manual cu tehnici tradiționale. Fiecare piesă este unică și reflectă pasiunea noastră pentru arta ceramicii.",
    banner: "/placeholder.svg",
    avatar: "/placeholder.svg",
    rating: 4.8,
    reviewCount: 127,
    location: "București, România",
    memberSince: "2014",
    verified: true,
    categories: ["ghivece", "vaze", "accesorii"],
    products: [
      { id: 1, slug: "ghiveci-ceramic-alb", title: "Ghiveci ceramic alb", price: 49.9, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
      { id: 2, slug: "ghiveci-ceramic-marime-mare", title: "Ghiveci ceramic mărime mare", price: 89.9, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
      { id: 3, slug: "vaza-ceramic-inalta", title: "Vază ceramic înaltă", price: 65.0, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
      { id: 4, slug: "ghiveci-ceramic-rotund", title: "Ghiveci ceramic rotund", price: 35.0, imageUrl: "/placeholder.svg", sellerSlug: "atelier-ceramic" },
    ],
    stats: {
      totalProducts: 45,
      totalSales: 1200,
      responseTime: "2 ore",
      satisfaction: "98%",
      totalClients: 500,
      averageRating: 4.8
    },
    reviews: [
      { id: 1, author: "Maria Ionescu", rating: 5, comment: "Produse de excepție! Calitatea ceramicii este remarcabilă.", date: "2024-01-10" },
      { id: 2, author: "Alexandru Pop", rating: 5, comment: "Serviciu excelent și produse foarte frumoase. Recomand cu încredere!", date: "2024-01-08" },
    ]
  }
};

export default function SellerPage({ params }: { params: { slug: string } }) {
  const seller = sellers[params.slug as keyof typeof sellers];

  if (!seller) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center py-12">
            <H1>Vânzător nu găsit</H1>
            <P className="text-slate-600 dark:text-slate-300 mt-2">
              Vânzătorul pe care îl căutați nu există sau a fost mutat.
            </P>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Vânzători", href: "/s" },
    { label: seller.name },
  ];

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

          {/* Banner */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative h-64 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800"
          >
            <OptimizedImage
              src={seller.banner}
              alt={`Banner ${seller.name}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <H1 className="text-white">{seller.name}</H1>
              <Lead className="text-white/90 mt-1">{seller.description}</Lead>
            </div>
          </motion.div>

          {/* Seller Info */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col md:flex-row gap-6 items-start md:items-center"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <OptimizedImage
                  src={seller.avatar}
                  alt={seller.name}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-white dark:border-slate-800 shadow-lg"
                />
                {seller.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <H2>{seller.name}</H2>
                  {seller.verified && (
                    <Badge variant="brand">Verificat</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{seller.rating}</span>
                    <span className="text-sm text-slate-500">({seller.reviewCount} recenzii)</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {seller.location}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{seller.stats.totalProducts}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Produse</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{seller.stats.totalSales}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Vânzări</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{seller.stats.averageRating}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{seller.stats.satisfaction}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Satisfacție</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <UITabs
              defaultValue="products"
              tabs={[
                {
                  value: "products",
                  label: "Produse",
                  content: (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <H2>Produsele vânzătorului</H2>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {seller.products.length} produse găsite
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {seller.products.map((product) => (
                          <motion.div key={product.id} variants={fadeInUp}>
                            <ProductCard {...product} />
                          </motion.div>
                        ))}
                      </div>

                      {seller.products.length === 0 && (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                          <H3>Nu există produse</H3>
                          <P className="text-slate-600 dark:text-slate-300">
                            Acest vânzător nu are produse disponibile momentan.
                          </P>
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  value: "about",
                  label: "Despre",
                  content: (
                    <div className="space-y-6">
                      <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                          <div>
                            <H2>Despre {seller.name}</H2>
                            <P className="mt-2">{seller.longDescription}</P>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium">Locație</span>
                              </div>
                              <P className="text-sm text-slate-600 dark:text-slate-300">{seller.location}</P>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium">Membru din</span>
                              </div>
                              <P className="text-sm text-slate-600 dark:text-slate-300">{seller.memberSince}</P>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium">Specializare</span>
                              </div>
                              <P className="text-sm text-slate-600 dark:text-slate-300">Ceramică artizanală</P>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium">Clienți</span>
                              </div>
                              <P className="text-sm text-slate-600 dark:text-slate-300">{seller.stats.totalClients} clienți mulțumiți</P>
                            </div>
                          </div>

                          <div>
                            <H3>Recenzii recente</H3>
                            <div className="space-y-4 mt-4">
                              {seller.reviews.map((review) => (
                                <Card key={review.id}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i < review.rating
                                                ? "text-yellow-400 fill-current"
                                                : "text-slate-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium">{review.author}</span>
                                      <span className="text-xs text-slate-500">{review.date}</span>
                                    </div>
                                    <P className="text-sm">{review.comment}</P>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Statistici</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Produse active</span>
                                <span className="font-semibold">{seller.stats.totalProducts}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Vânzări totale</span>
                                <span className="font-semibold">{seller.stats.totalSales}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Rating mediu</span>
                                <span className="font-semibold">{seller.stats.averageRating}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Satisfacție</span>
                                <span className="font-semibold">{seller.stats.satisfaction}</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Button className="w-full">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Trimite mesaj
                              </Button>
                              <Button variant="outline" className="w-full">
                                Vezi toate produsele
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}