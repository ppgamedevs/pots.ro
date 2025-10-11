import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cookie, 
  Shield, 
  Settings, 
  Info,
  CheckCircle,
  AlertCircle,
  Eye,
  Database,
  Target,
  Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie-uri - FloristMarket.ro",
  description: "Politica de utilizare a cookie-urilor pe FloristMarket. Informații despre tipurile de cookie-uri, utilizarea lor și opțiunile de control.",
  openGraph: {
    title: "Cookie-uri - FloristMarket.ro",
    description: "Politica de utilizare a cookie-urilor pe FloristMarket. Informații despre tipurile de cookie-uri, utilizarea lor și opțiunile de control.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/cookies'
  }
};

const cookieTypes = [
  {
    type: "Cookie-uri esențiale",
    description: "Necesare pentru funcționarea de bază a site-ului",
    icon: <Shield className="h-6 w-6" />,
    color: "bg-green-50 text-green-700 border-green-200",
    examples: [
      "Autentificarea utilizatorilor",
      "Coșul de cumpărături",
      "Preferințele de securitate",
      "Sesiunea de navigare"
    ],
    required: true
  },
  {
    type: "Cookie-uri de performanță",
    description: "Colectează informații despre utilizarea site-ului",
    icon: <Target className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    examples: [
      "Statistici de utilizare",
      "Timpul de încărcare",
      "Pagini vizitate",
      "Erorile întâlnite"
    ],
    required: false
  },
  {
    type: "Cookie-uri de funcționalitate",
    description: "Îmbunătățesc experiența de utilizare",
    icon: <Settings className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    examples: [
      "Preferințele de limbă",
      "Setările de afișare",
      "Memorarea preferințelor",
      "Personalizarea conținutului"
    ],
    required: false
  },
  {
    type: "Cookie-uri de marketing",
    description: "Folosite pentru publicitate și analiză",
    icon: <Eye className="h-6 w-6" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    examples: [
      "Publicitate personalizată",
      "Urmărirea conversiilor",
      "Analiza comportamentului",
      "Rețele de socializare"
    ],
    required: false
  }
];

const cookieDetails = [
  {
    name: "_floristmarket_session",
    purpose: "Menține sesiunea utilizatorului autentificat",
    duration: "Sesiune",
    type: "Esențial"
  },
  {
    name: "cart_items",
    purpose: "Memorează produsele din coșul de cumpărături",
    duration: "30 zile",
    type: "Esențial"
  },
  {
    name: "user_preferences",
    purpose: "Salvează preferințele utilizatorului",
    duration: "1 an",
    type: "Funcționalitate"
  },
  {
    name: "_ga",
    purpose: "Google Analytics - urmărește utilizarea site-ului",
    duration: "2 ani",
    type: "Performanță"
  },
  {
    name: "_fbp",
    purpose: "Facebook Pixel - urmărește conversiile",
    duration: "90 zile",
    type: "Marketing"
  }
];

const faqs = [
  {
    question: "Ce sunt cookie-urile?",
    answer: "Cookie-urile sunt fișiere text mici stocate pe dispozitivul tău când vizitezi un site web. Ele permit site-ului să-ți amintească preferințele și să îmbunătățească experiența de navigare."
  },
  {
    question: "Pot dezactiva cookie-urile?",
    answer: "Da, poți dezactiva cookie-urile în setările browser-ului tău. Totuși, acest lucru poate afecta funcționalitatea site-ului și experiența ta de utilizare."
  },
  {
    question: "Cookie-urile sunt sigure?",
    answer: "Da, folosim doar cookie-uri sigure și criptate. Nu stocăm informații sensibile în cookie-uri și respectăm toate standardele de securitate."
  },
  {
    question: "Cât timp sunt stocate cookie-urile?",
    answer: "Durata de viață a cookie-urilor variază de la sesiune (se șterg la închiderea browser-ului) la 2 ani pentru cookie-urile de analiză."
  }
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Politica de cookie-uri
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Informații despre utilizarea cookie-urilor pe FloristMarket. 
              Înțelege cum folosim cookie-urile pentru a îmbunătăți experiența ta de navigare 
              și cum poți controla preferințele tale.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4" />
                <span>Transparență completă</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Securitate garantată</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Control total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Tipuri de cookie-uri</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {cookieTypes.map((cookie, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${cookie.color}`}>
                        {cookie.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cookie.type}</CardTitle>
                        <p className="text-gray-600 text-sm">{cookie.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={cookie.required ? "default" : "secondary"} className="text-xs">
                        {cookie.required ? "Obligatoriu" : "Opțional"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium mb-3">Exemple de utilizare:</h4>
                    <ul className="space-y-2">
                      {cookie.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Details */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Cookie-uri specifice</h2>
            <div className="space-y-4">
              {cookieDetails.map((cookie, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold text-sm">{cookie.name}</h3>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">{cookie.purpose}</p>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {cookie.duration}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Badge 
                          variant={cookie.type === "Esențial" ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {cookie.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Control Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Controlul cookie-urilor</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Setări browser</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Poți controla cookie-urile direct din setările browser-ului tău
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Chrome: Setări → Confidențialitate</li>
                    <li>• Firefox: Opțiuni → Confidențialitate</li>
                    <li>• Safari: Preferințe → Confidențialitate</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-green-50 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Consimțământ</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Îți cerem consimțământul pentru cookie-urile non-esențiale
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Banner de consimțământ</li>
                    <li>• Opțiuni granular</li>
                    <li>• Posibilitate de retragere</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-purple-50 rounded-full">
                      <Info className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Transparență</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Informații complete despre utilizarea cookie-urilor
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Lista completă de cookie-uri</li>
                    <li>• Scopul utilizării</li>
                    <li>• Durata de stocare</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Întrebări frecvente</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 pl-7">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ai întrebări despre cookie-uri?
            </h2>
            <p className="text-xl mb-8 opacity-90 text-white">
              Dacă ai întrebări despre utilizarea cookie-urilor pe FloristMarket, 
              nu ezita să ne contactezi pentru clarificări.
            </p>
            <div className="text-sm opacity-80">
              <p>Email: privacy@floristmarket.ro</p>
              <p>Telefon: +40 21 123 4567</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
