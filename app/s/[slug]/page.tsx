"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    reviews: 127,
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
      satisfaction: "98%"
    }
  },
  "cardboard-street": {
    name: "Cardboard Street",
    slug: "cardboard-street",
    description: "Producători de cutii și ambalaje eco-friendly. Ne specializăm în soluții creative și durabile pentru industria florală.",
    longDescription: "Cardboard Street este o companie inovatoare în domeniul ambalajelor eco-friendly. De peste 5 ani, producem cutii, vaze și accesorii din materiale reciclate pentru industria florală. Ne preocupă sustenabilitatea și oferim soluții creative pentru florarii și aranjatori.",
    banner: "/placeholder.svg",
    avatar: "/placeholder.svg",
    rating: 4.6,
    reviews: 89,
    location: "Cluj-Napoca, România",
    memberSince: "2019",
    verified: true,
    categories: ["cutii", "ambalaje", "accesorii"],
    products: [
      { id: 7, slug: "cutie-inalta-nevopsita", title: "Cutie înaltă natur", price: 79.0, imageUrl: "/placeholder.svg", sellerSlug: "cardboard-street" },
      { id: 8, slug: "cutie-patrata-alba", title: "Cutie pătrată albă", price: 45.0, imageUrl: "/placeholder.svg", sellerSlug: "cardboard-street" },
      { id: 9, slug: "cutie-rotunda-aurie", title: "Cutie rotundă aurie", price: 65.0, imageUrl: "/placeholder.svg", sellerSlug: "cardboard-street" },
    ],
    stats: {
      totalProducts: 28,
      totalSales: 650,
      responseTime: "4 ore",
      satisfaction: "96%"
    }
  }
};

export default function SellerPage({ params }: { params: { slug: string } }) {
  const [activeTab, setActiveTab] = useState("products");

  const seller = sellers[params.slug as keyof typeof sellers];

  if (!seller) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="text-center">
            <H1>Vânzător nu găsit</H1>
            <P>Vânzătorul pe care îl căutați nu există sau a fost mutat.</P>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Înapoi
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: "Vânzători", href: "/s" },
    { label: seller.name, href: `/s/${seller.slug}` },
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
            variants={stagger}
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden"
          >
            <OptimizedImage
              src={seller.banner}
              alt={`${seller.name} banner`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Seller Info Overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white">
                  <OptimizedImage
                    src={seller.avatar}
                    alt={seller.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <H1 className="text-2xl md:text-3xl text-white">{seller.name}</H1>
                    {seller.verified && (
                      <Badge variant="success" className="bg-green-500">
                        Verificat
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/90">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{seller.rating}</span>
                      <span>({seller.reviews} recenzii)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{seller.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Membru din {seller.memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-brand" />
                <div className="text-2xl font-bold">{seller.stats.totalProducts}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Produse</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-brand" />
                <div className="text-2xl font-bold">{seller.stats.totalSales}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Vânzări</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-brand" />
                <div className="text-2xl font-bold">{seller.stats.responseTime}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Timp răspuns</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-brand" />
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Produse</TabsTrigger>
                <TabsTrigger value="about">Despre</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="about" className="space-y-6">
                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <H2>Despre {seller.name}</H2>
                      <P className="mt-2">{seller.longDescription}</P>
                    </div>

                    <div>
                      <H3>Specializări</H3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {seller.categories.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <H3>Informații de contact</H3>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span>{seller.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>Membru din {seller.memberSince}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-slate-500" />
                          <span>Rating: {seller.rating}/5 ({seller.reviews} recenzii)</span>
                        </div>
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
                          <span className="text-slate-600 dark:text-slate-300">Timp răspuns</span>
                          <span className="font-semibold">{seller.stats.responseTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Satisfacție clienți</span>
                          <span className="font-semibold">{seller.stats.satisfaction}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Contactează vânzătorul</CardTitle>
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
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
