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
    id: "ghid-complet-incepatori",
    title: "Ghidul complet pentru începători în grădinăritul de interior",
    category: "Îngrijire",
    readTime: "15 min",
    difficulty: "Începător",
    icon: <Leaf className="h-6 w-6" />,
    description: "Tot ce trebuie să știi pentru a începe să cultivi plante în casă. De la alegerea primelor plante până la crearea unui mediu ideal pentru ele.",
    topics: [
      "Cele mai bune plante pentru începători",
      "Cum să alegi locația potrivită",
      "Tehnici de udare pentru fiecare tip de plantă",
      "Semnale că plantele au nevoie de ajutor",
      "Echipamentul esențial pentru începători"
    ],
    href: "/ghiduri/ghid-complet-incepatori"
  },
  {
    id: "plante-imposibil-omorat",
    title: "10 plante imposibil de omorât pentru începători",
    category: "Îngrijire",
    readTime: "12 min",
    difficulty: "Începător",
    icon: <Shield className="h-6 w-6" />,
    description: "Descoperă cele mai rezistente plante de interior care supraviețuiesc chiar și celor mai neglijenți grădinari.",
    topics: [
      "Sansevieria - planta de fier",
      "Pothos - planta care crește oriunde",
      "ZZ Plant - perfectă pentru birou",
      "Aloe Vera - planta medicinală",
      "Spider Plant - ideală pentru bucătărie"
    ],
    href: "/ghiduri/plante-imposibil-omorat"
  },
  {
    id: "ghivece-perfect-2025",
    title: "Cum alegi ghiveciul perfect în 2025: Ghid complet pentru toate tipurile de plante",
    category: "Ghivece",
    readTime: "18 min",
    difficulty: "Intermediar",
    icon: <Ruler className="h-6 w-6" />,
    description: "Ghidul definitiv pentru alegerea ghivecelor. Învață despre materiale, dimensiuni, drenaj și cum să creezi un sistem perfect pentru fiecare plantă.",
    topics: [
      "Materiale de ghivece: ceramică vs plastic vs teracotă",
      "Calcularea dimensiunii perfecte pentru fiecare plantă",
      "Sisteme de drenaj profesionale",
      "Ghivece auto-irigante pentru vacanțe",
      "Design și estetică în aranjarea ghivecelor"
    ],
    href: "/ghiduri/ghivece-perfect-2025"
  },
  {
    id: "ingrijire-plante-interior-2025",
    title: "Îngrijirea plantelor de interior în 2025: Tehnici moderne și sfaturi de la experți",
    category: "Îngrijire",
    readTime: "20 min",
    difficulty: "Intermediar",
    icon: <Droplets className="h-6 w-6" />,
    description: "Tehnici avansate de îngrijire a plantelor de interior, de la sisteme de irigare automată la controlul umidității și luminii.",
    topics: [
      "Sisteme de irigare automată pentru plante",
      "Controlul umidității în apartament",
      "Iluminat artificial pentru plante",
      "Fertilizare sezonieră și programe personalizate",
      "Prevenirea și tratarea bolilor plantelor"
    ],
    href: "/ghiduri/ingrijire-plante-interior-2025"
  },
  {
    id: "aranjamente-florale-profesionale",
    title: "Crearea aranjamentelor florale profesionale: Tehnici de la florării",
    category: "Design",
    readTime: "25 min",
    difficulty: "Avansat",
    icon: <Sun className="h-6 w-6" />,
    description: "Tehnici profesionale pentru crearea aranjamentelor florale spectaculoase. Învață secretul florăriilor pentru aranjamente care țin săptămâni.",
    topics: [
      "Principiile designului floral",
      "Combinarea culorilor în aranjamente",
      "Tehnici de prelucrare a florilor",
      "Conservarea și prelungirea vieții florilor",
      "Aranjamente pentru ocazii speciale"
    ],
    href: "/ghiduri/aranjamente-florale-profesionale"
  },
  {
    id: "plante-purificatoare-aer-2025",
    title: "Plantele care purifică aerul în 2025: Ghid științific pentru un aer mai curat",
    category: "Eco",
    readTime: "14 min",
    difficulty: "Începător",
    icon: <Star className="h-6 w-6" />,
    description: "Descoperă plantele cu adevărat eficiente în purificarea aerului, bazat pe studii științifice recente.",
    topics: [
      "Studiul NASA și plantele purificatoare",
      "Top 10 plante pentru purificarea aerului",
      "Cum să maximizezi efectul purificator",
      "Plante pentru dormitor și birou",
      "Beneficii pentru sănătate și productivitate"
    ],
    href: "/ghiduri/plante-purificatoare-aer-2025"
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
    title: "Ghidul complet pentru începători în grădinăritul de interior",
    description: "Tot ce trebuie să știi pentru a începe să cultivi plante în casă. De la alegerea primelor plante până la crearea unui mediu ideal.",
    image: "/images/ghid-incepatori.jpg",
    readTime: "15 min",
    rating: 4.8
  },
  {
    title: "10 plante imposibil de omorât pentru începători",
    description: "Descoperă cele mai rezistente plante de interior care supraviețuiesc chiar și celor mai neglijenți grădinari.",
    image: "/images/plante-rezistente.jpg",
    readTime: "12 min",
    rating: 4.9
  },
  {
    title: "Cum alegi ghiveciul perfect în 2025",
    description: "Ghidul definitiv pentru alegerea ghivecelor. Învață despre materiale, dimensiuni, drenaj și sisteme profesionale.",
    image: "/images/ghivece-perfect.jpg",
    readTime: "18 min",
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
            <h2 className="text-3xl font-bold mb-4 text-white">
              Primește ghiduri noi în inbox
            </h2>
            <p className="text-xl mb-8 opacity-90 text-white">
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
