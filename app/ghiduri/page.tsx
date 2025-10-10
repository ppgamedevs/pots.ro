import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Ruler, 
  Droplets, 
  Sun,
  Leaf,
  Shield,
  ShoppingCart,
  Truck,
  RotateCcw,
  Star,
  Clock,
  Info,
  ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ghiduri - FloristMarket.ro",
  description: "Ghiduri complete pentru îngrijirea plantelor, alegerea ghivecelor și crearea aranjamentelor florale. Sfaturi de la experți.",
  openGraph: {
    title: "Ghiduri - FloristMarket.ro",
    description: "Ghiduri complete pentru îngrijirea plantelor, alegerea ghivecelor și crearea aranjamentelor florale. Sfaturi de la experți.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/ghiduri'
  }
};

const guides = [
  {
    id: "ghivece-perfect",
    title: "Cum alegi ghiveciul perfect",
    category: "Ghivece",
    readTime: "5 min",
    difficulty: "Începător",
    icon: <Ruler className="h-6 w-6" />,
    description: "Învață să alegi ghiveciul potrivit pentru fiecare tip de plantă, dimensiune și stil de decor.",
    topics: [
      "Dimensiuni și proporții",
      "Materiale și durabilitate",
      "Drenaj și aerisire",
      "Stiluri decorative"
    ],
    href: "/ghiduri/ghivece-perfect"
  },
  {
    id: "ingrijire-plante",
    title: "Îngrijirea plantelor de interior",
    category: "Îngrijire",
    readTime: "8 min",
    difficulty: "Intermediar",
    icon: <Leaf className="h-6 w-6" />,
    description: "Ghid complet pentru îngrijirea plantelor de interior: udare, fertilizare, lumină și temperatură.",
    topics: [
      "Programul de udare",
      "Tipuri de fertilizare",
      "Necesități de lumină",
      "Controlul temperaturii"
    ],
    href: "/ghiduri/ingrijire-plante"
  },
  {
    id: "aranjamente-florale",
    title: "Crearea aranjamentelor florale",
    category: "Design",
    readTime: "12 min",
    difficulty: "Avansat",
    icon: <Sun className="h-6 w-6" />,
    description: "Tehnici profesionale pentru crearea aranjamentelor florale frumoase și durabile.",
    topics: [
      "Combinarea culorilor",
      "Tehnici de aranjare",
      "Păstrarea florilor",
      "Accesorii decorative"
    ],
    href: "/ghiduri/aranjamente-florale"
  },
  {
    id: "plante-toamna",
    title: "Plante potrivite pentru toamnă",
    category: "Sezonale",
    readTime: "6 min",
    difficulty: "Începător",
    icon: <Droplets className="h-6 w-6" />,
    description: "Descoperă cele mai potrivite plante pentru decorul de toamnă și cum să le îngrijești.",
    topics: [
      "Plante rezistente la frig",
      "Culori de toamnă",
      "Prepararea pentru iarnă",
      "Decoruri sezoniere"
    ],
    href: "/ghiduri/plante-toamna"
  },
  {
    id: "drenaj-sistem",
    title: "Sistemul de drenaj în ghivece",
    category: "Tehnic",
    readTime: "4 min",
    difficulty: "Intermediar",
    icon: <Shield className="h-6 w-6" />,
    description: "Înțelege importanța drenajului și cum să creezi un sistem eficient pentru plantele tale.",
    topics: [
      "Importanța drenajului",
      "Materiale de drenaj",
      "Instalarea sistemului",
      "Întreținerea drenajului"
    ],
    href: "/ghiduri/drenaj-sistem"
  },
  {
    id: "fertilizare-naturala",
    title: "Fertilizare naturală și organică",
    category: "Eco",
    readTime: "7 min",
    difficulty: "Intermediar",
    icon: <Star className="h-6 w-6" />,
    description: "Metode naturale de fertilizare pentru plante sănătoase și mediu prietenos.",
    topics: [
      "Compostul natural",
      "Fertilizatori organici",
      "Tehnici de aplicare",
      "Beneficii pentru mediu"
    ],
    href: "/ghiduri/fertilizare-naturala"
  }
];

const categories = [
  {
    name: "Ghivece",
    count: 15,
    icon: <Ruler className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-600"
  },
  {
    name: "Îngrijire",
    count: 23,
    icon: <Leaf className="h-5 w-5" />,
    color: "bg-green-50 text-green-600"
  },
  {
    name: "Design",
    count: 18,
    icon: <Sun className="h-5 w-5" />,
    color: "bg-yellow-50 text-yellow-600"
  },
  {
    name: "Sezonale",
    count: 12,
    icon: <Droplets className="h-5 w-5" />,
    color: "bg-orange-50 text-orange-600"
  },
  {
    name: "Tehnic",
    count: 8,
    icon: <Shield className="h-5 w-5" />,
    color: "bg-purple-50 text-purple-600"
  },
  {
    name: "Eco",
    count: 6,
    icon: <Star className="h-5 w-5" />,
    color: "bg-emerald-50 text-emerald-600"
  }
];

const featuredGuides = [
  {
    title: "Ghidul complet pentru începători",
    description: "Tot ce trebuie să știi pentru a începe să cultivi plante în casă",
    image: "/images/ghid-incepatori.jpg",
    readTime: "15 min",
    rating: 4.8
  },
  {
    title: "10 plante imposibil de omorât",
    description: "Plante rezistente perfecte pentru începători",
    image: "/images/plante-rezistente.jpg",
    readTime: "8 min",
    rating: 4.9
  },
  {
    title: "Decorul perfect cu plante",
    description: "Cum să transformi casa într-un paradis verde",
    image: "/images/decor-plante.jpg",
    readTime: "12 min",
    rating: 4.7
  }
];

export default function GhiduriPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Ghiduri pentru iubitorii de plante
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Descoperă ghiduri complete despre îngrijirea plantelor, alegerea ghivecelor 
              și crearea aranjamentelor florale. Sfaturi de la experți pentru grădina ta de interior.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>80+ ghiduri</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Experți în domeniu</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Actualizate zilnic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Categorii de ghiduri</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${category.color}`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-gray-600 text-sm">{category.count} ghiduri</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Ghiduri recomandate</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredGuides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 rounded-t-lg mb-4"></div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Recomandat
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{guide.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{guide.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{guide.readTime}</span>
                      <Button variant="outline" size="sm">
                        Citește
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Guides */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Toate ghidurile</h2>
            <div className="space-y-6">
              {guides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          {guide.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {guide.category}
                          </Badge>
                          <Badge 
                            variant={guide.difficulty === "Începător" ? "default" : 
                                   guide.difficulty === "Intermediar" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {guide.difficulty}
                          </Badge>
                          <span className="text-sm text-gray-500">{guide.readTime}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
                        <p className="text-gray-600 mb-4">{guide.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {guide.topics.map((topic, topicIndex) => (
                            <span key={topicIndex} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Citește ghidul
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Primește ghiduri noi în inbox
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Abonează-te la newsletter-ul nostru și primește cele mai noi ghiduri 
              despre îngrijirea plantelor direct în email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Adresa ta de email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Abonează-te
              </Button>
            </div>
            <p className="text-sm opacity-80 mt-4">
              Fără spam. Poți să te dezabonezi oricând.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
