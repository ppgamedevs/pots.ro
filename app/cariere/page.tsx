import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Users, 
  Heart, 
  Code, 
  ShoppingCart, 
  MessageSquare,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cariere - FloristMarket.ro",
  description: "Alătură-te echipei FloristMarket și ajută-ne să construim cel mai mare marketplace de floristică din România.",
  openGraph: {
    title: "Cariere - FloristMarket.ro",
    description: "Alătură-te echipei FloristMarket și ajută-ne să construim cel mai mare marketplace de floristică din România.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/cariere'
  }
};

const jobOpenings = [
  {
    id: "frontend-dev",
    title: "Frontend Developer",
    department: "Tehnologie",
    location: "București / Remote",
    type: "Full-time",
    level: "Mid-level",
    description: "Cautăm un frontend developer pasionat pentru a ne ajuta să construim experiențe digitale excepționale pentru utilizatorii FloristMarket.",
    requirements: [
      "3+ ani experiență cu React/Next.js",
      "Cunoaștere profundă TypeScript",
      "Experiență cu Tailwind CSS",
      "Înțelegere UX/UI principles",
      "Experiență cu state management (Redux/Zustand)"
    ],
    benefits: [
      "Salariu competitiv + equity",
      "Flexibilitate completă (remote/hybrid)",
      "Buget pentru echipament și training",
      "Asigurări medicale private",
      "25 zile de concediu + sărbători legale"
    ]
  },
  {
    id: "backend-dev",
    title: "Backend Developer",
    department: "Tehnologie",
    location: "București / Remote",
    type: "Full-time",
    level: "Senior",
    description: "Joacă un rol cheie în dezvoltarea arhitecturii backend scalabile care susține platforma FloristMarket.",
    requirements: [
      "5+ ani experiență cu Node.js/Python",
      "Experiență cu PostgreSQL/MongoDB",
      "Cunoaștere microservicii și API design",
      "Experiență cu cloud platforms (AWS/GCP)",
      "Înțelegere security best practices"
    ],
    benefits: [
      "Salariu 15.000-20.000 RON",
      "Stock options",
      "Buget 5.000 RON/lună pentru training",
      "Asigurări medicale premium",
      "Flexibilitate completă program"
    ]
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    department: "Marketing",
    location: "București",
    type: "Full-time",
    level: "Mid-level",
    description: "Condu strategia de marketing digital pentru a crește awareness-ul și conversiile pe platforma FloristMarket.",
    requirements: [
      "3+ ani experiență marketing digital",
      "Experiență cu Google Ads, Facebook Ads",
      "Cunoaștere SEO/SEM",
      "Experiență cu analytics tools",
      "Abilități de copywriting în română"
    ],
    benefits: [
      "Salariu 8.000-12.000 RON",
      "Bonus pe performanță",
      "Buget pentru conferințe și training",
      "Asigurări medicale",
      "Program flexibil"
    ]
  },
  {
    id: "customer-success",
    title: "Customer Success Specialist",
    department: "Suport Clienți",
    location: "București / Remote",
    type: "Full-time",
    level: "Entry-level",
    description: "Ajută clienții să obțină cea mai bună experiență pe platforma FloristMarket și construiește relații de lungă durată.",
    requirements: [
      "Experiență în suport clienți (preferabil)",
      "Excelente abilități de comunicare",
      "Cunoaștere română și engleză",
      "Abilități de problem-solving",
      "Empatie și răbdare"
    ],
    benefits: [
      "Salariu 4.500-6.000 RON",
      "Bonus pe satisfacția clienților",
      "Training complet în primul an",
      "Asigurări medicale",
      "Program stabil 9-18"
    ]
  }
];

const companyValues = [
  {
    icon: <Heart className="h-8 w-8 text-red-500" />,
    title: "Pasiune pentru natură",
    description: "Credem că fiecare plantă merită să fie îngrijită cu dragoste și că fiecare client merită produse de calitate."
  },
  {
    icon: <Users className="h-8 w-8 text-blue-500" />,
    title: "Echipa noastră",
    description: "Construim o cultură de colaborare, respect și învățare continuă, unde fiecare voce contează."
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-green-500" />,
    title: "Crescere continuă",
    description: "Investim în dezvoltarea profesională a fiecărui membru al echipei și în tehnologii de ultimă generație."
  },
  {
    icon: <Shield className="h-8 w-8 text-purple-500" />,
    title: "Încredere și siguranță",
    description: "Construim o platformă sigură și transparentă pentru clienți și vânzători, bazată pe încredere reciprocă."
  }
];

const perks = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Flexibilitate completă",
    description: "Lucrează de acasă, din birou sau hibrid - alegi tu"
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "Tehnologie de top",
    description: "Echipament modern și acces la cele mai noi tools și tehnologii"
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Cultură deschisă",
    description: "Comunicare transparentă și feedback constructiv în toate direcțiile"
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: "Beneficii exclusive",
    description: "Reduceri la produse, buget wellness și activități de echipă"
  }
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Construiește viitorul floristicii cu noi
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Alătură-te echipei FloristMarket și ajută-ne să transformăm modul în care românii 
              cumpără și vând produse florale. Căutăm oameni pasionați, creativi și dedicați 
              să construiască ceva cu adevărat special.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Echipa de 25+ oameni</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>București + Remote</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Crescere rapidă</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Valorile noastre</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyValues.map((value, index) => (
                <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Posturi disponibile</h2>
              <p className="text-gray-600">
                Căutăm oameni talentați să se alăture echipei noastre în creștere
              </p>
            </div>

            <div className="space-y-6">
              {jobOpenings.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{job.department}</Badge>
                          <Badge variant="outline">{job.level}</Badge>
                          <Badge variant="outline">{job.type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">
                          Aplică acum
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{job.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Cerințe:</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Beneficii:</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {job.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perks & Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">De ce să lucrezi cu noi?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {perks.map((perk, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      {perk.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{perk.title}</h3>
                  <p className="text-gray-600 text-sm">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Nu găsești postul potrivit?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Trimite-ne CV-ul tău și te vom contacta când avem o oportunitate potrivită pentru tine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Trimite CV-ul tău
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Contactează-ne
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
