import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Calendar, 
  FileText, 
  Image as ImageIcon,
  Mail,
  Phone,
  ExternalLink,
  Users,
  TrendingUp,
  Award,
  Globe
} from "lucide-react";

export const metadata: Metadata = {
  title: "Presa - FloristMarket.ro",
  description: "Resurse pentru presă, comunicate, logo-uri și informații despre FloristMarket - cel mai mare marketplace de floristică din România.",
  openGraph: {
    title: "Presa - FloristMarket.ro",
    description: "Resurse pentru presă, comunicate, logo-uri și informații despre FloristMarket - cel mai mare marketplace de floristică din România.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/presa'
  }
};

const pressReleases = [
  {
    id: "launch-2024",
    title: "FloristMarket lansează cel mai mare marketplace de floristică din România",
    date: "15 Martie 2024",
    category: "Lansare",
    summary: "Platforma inovatoare conectează vânzătorii de produse florale cu clienții din toată țara, oferind o experiență de cumpărături simplă și sigură.",
    downloadUrl: "/press/floristmarket-lansare-martie-2024.pdf"
  },
  {
    id: "funding-2024",
    title: "FloristMarket strânge 2 milioane EUR pentru expansiunea în Europa de Est",
    date: "10 Iunie 2024",
    category: "Finanțare",
    summary: "Investiția va fi folosită pentru dezvoltarea tehnologiei, extinderea echipei și lansarea în țările vecine.",
    downloadUrl: "/press/floristmarket-finantare-iunie-2024.pdf"
  },
  {
    id: "partnership-2024",
    title: "FloristMarket parteneriază cu principalele grădini din România",
    date: "5 Septembrie 2024",
    category: "Parteneriat",
    summary: "Colaborarea cu 50+ de grădini și producători locali aduce produse autentice și de calitate pe platformă.",
    downloadUrl: "/press/floristmarket-parteneriat-gradini-2024.pdf"
  }
];

const mediaKit = [
  {
    title: "Logo-uri oficiale",
    description: "Logo-uri în diferite formate și culori pentru utilizare în media",
    items: [
      "Logo principal (PNG, SVG)",
      "Logo alb pe fundal transparent",
      "Logo color pe fundal alb",
      "Iconița aplicației",
      "Banner-uri pentru social media"
    ],
    downloadUrl: "/press/floristmarket-logos.zip"
  },
  {
    title: "Imagini produse",
    description: "Imagini de înaltă calitate cu produsele noastre pentru articole",
    items: [
      "Ghivece ceramice premium",
      "Cutii decorative elegante",
      "Accesorii florale moderne",
      "Aranjamente complete",
      "Imagini lifestyle cu produse"
    ],
    downloadUrl: "/press/floristmarket-imagini-produse.zip"
  },
  {
    title: "Imagini echipă",
    description: "Fotografii profesionale cu echipa de management",
    items: [
      "CEO - Alexandra Popescu",
      "CTO - Mihai Ionescu",
      "Echipa de dezvoltare",
      "Echipa de marketing",
      "Fotografii de birou"
    ],
    downloadUrl: "/press/floristmarket-imagini-echipa.zip"
  }
];

const companyStats = [
  {
    icon: <Users className="h-8 w-8 text-blue-500" />,
    title: "25.000+",
    description: "Clienți activi"
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-green-500" />,
    title: "500+",
    description: "Vânzători verificați"
  },
  {
    icon: <Award className="h-8 w-8 text-yellow-500" />,
    title: "10.000+",
    description: "Produse disponibile"
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "47",
    description: "Județe acoperite"
  }
];

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email presă",
    contact: "press@floristmarket.ro",
    description: "Pentru interviuri și comunicate"
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: "Telefon",
    contact: "+40 21 123 4567",
    description: "Luni-Vineri, 9:00-18:00"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Comunicate",
    contact: "comunicate@floristmarket.ro",
    description: "Pentru anunțuri oficiale"
  }
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Centrul de presă FloristMarket
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Găsește toate resursele necesare pentru a scrie despre FloristMarket: 
              comunicate de presă, logo-uri, imagini și informații despre companie.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Actualizat zilnic</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Resurse gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Imagini HD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">FloristMarket în cifre</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyStats.map((stat, index) => (
                <Card key={index} className="text-center border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stat.title}</div>
                    <p className="text-gray-600">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Comunicate de presă</h2>
            <div className="space-y-6">
              {pressReleases.map((release) => (
                <Card key={release.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">{release.category}</Badge>
                          <span className="text-sm text-gray-500">{release.date}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{release.title}</h3>
                        <p className="text-gray-600">{release.summary}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descarcă PDF
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
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

      {/* Media Kit */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Media Kit</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {mediaKit.map((kit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      {kit.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm">{kit.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4 text-sm text-gray-600">
                      {kit.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Descarcă ZIP
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Contact presă</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {contactInfo.map((contact, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white/10 rounded-full">
                      {contact.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{contact.title}</h3>
                  <p className="text-lg mb-1">{contact.contact}</p>
                  <p className="text-sm opacity-80">{contact.description}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <p className="text-lg mb-6 opacity-90">
                Pentru interviuri, declarații sau informații suplimentare, 
                nu ezita să ne contactezi. Răspundem în maximum 24 de ore.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Trimite email
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
