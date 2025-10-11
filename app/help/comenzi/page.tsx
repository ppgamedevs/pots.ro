import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Mail,
  Phone,
  AlertCircle,
  Info,
  ArrowRight,
  Shield,
  Truck,
  Package
} from "lucide-react";

export const metadata: Metadata = {
  title: "Comenzi - Help Center FloristMarket.ro",
  description: "Ghid complet pentru plasarea și gestionarea comenzilor pe FloristMarket. Pași de comandă, statusuri și notificări.",
  openGraph: {
    title: "Comenzi - Help Center FloristMarket.ro",
    description: "Ghid complet pentru plasarea și gestionarea comenzilor pe FloristMarket. Pași de comandă, statusuri și notificări.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/help/comenzi'
  }
};

const orderSteps = [
  {
    step: 1,
    title: "Adaugă produse în coș",
    description: "Navighează prin catalogul nostru și adaugă produsele dorite în coșul de cumpărături.",
    icon: <ShoppingCart className="h-6 w-6" />,
    details: [
      "Browseați prin categorii sau folosiți căutarea",
      "Vezi detalii complete despre fiecare produs",
      "Verifică disponibilitatea în stoc",
      "Alege cantitatea dorită"
    ]
  },
  {
    step: 2,
    title: "Finalizează comanda",
    description: "Completează datele de livrare și alege metoda de plată preferată.",
    icon: <CreditCard className="h-6 w-6" />,
    details: [
      "Introduceți adresa de livrare",
      "Alegeți metoda de plată (card, PayPal, Revolut)",
      "Verificați totalul comenzii",
      "Confirmați comanda"
    ]
  },
  {
    step: 3,
    title: "Plata și confirmarea",
    description: "Procesează plata în siguranță și primește confirmarea comenzii.",
    icon: <Shield className="h-6 w-6" />,
    details: [
      "Plata se procesează prin gateway-uri sigure",
      "Primești email de confirmare",
      "Numărul de comandă pentru urmărire",
      "Estimarea timpului de livrare"
    ]
  },
  {
    step: 4,
    title: "Pregătirea și livrarea",
    description: "Vânzătorul pregătește comanda și o trimite prin curier.",
    icon: <Truck className="h-6 w-6" />,
    details: [
      "Vânzătorul pregătește produsele",
      "Coletul este predat curierului",
      "Primești AWB pentru urmărire",
      "Livrare la adresa specificată"
    ]
  }
];

const orderStatuses = [
  {
    status: "Confirmată",
    description: "Comanda a fost plasată cu succes și confirmată.",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    status: "În pregătire",
    description: "Vânzătorul pregătește produsele pentru livrare.",
    icon: <Package className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    status: "Expediată",
    description: "Comanda a fost expediată și este în tranzit.",
    icon: <Truck className="h-5 w-5 text-orange-500" />,
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    status: "Livrată",
    description: "Comanda a fost livrată cu succes la adresa specificată.",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    status: "Anulată",
    description: "Comanda a fost anulată din motive specifice.",
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    color: "bg-red-50 text-red-700 border-red-200"
  }
];

const paymentMethods = [
  {
    name: "Card bancar",
    description: "Visa, Mastercard, American Express",
    icon: <CreditCard className="h-6 w-6" />,
    security: "Plăți securizate SSL 256-bit"
  },
  {
    name: "Revolut",
    description: "Plăți instant prin aplicația Revolut",
    icon: <CheckCircle className="h-6 w-6" />,
    security: "Verificare instantanee"
  }
];

const faqs = [
  {
    question: "Cum pot urmări comanda mea?",
    answer: "Poți urmări comanda folosind numărul AWB primit prin email sau accesând secțiunea 'Comenzile mele' din contul tău."
  },
  {
    question: "Pot modifica comanda după ce am plasat-o?",
    answer: "Comanda poate fi modificată doar înainte de confirmarea plată. După confirmare, contactează-ne pentru modificări."
  },
  {
    question: "Cât timp durează procesarea comenzii?",
    answer: "Comanda este procesată în maximum 24 de ore în zilele lucrătoare. Vânzătorul are până la 48 de ore pentru pregătire."
  },
  {
    question: "Ce se întâmplă dacă produsul nu este disponibil?",
    answer: "Dacă un produs nu este disponibil, vei fi notificat și vei primi o rambursare completă sau o alternativă similară."
  }
];

export default function ComenziPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Ghid complet pentru comenzi
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Învață cum să plasezi comenzi în siguranță pe FloristMarket și să urmărești 
              fiecare pas al procesului de la plasare la livrare.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Plăți 100% sigure</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Procesare rapidă</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Confirmare instantanee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Pașii unei comenzi</h2>
            <div className="space-y-8">
              {orderSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="text-sm">
                            Pasul {step.step}
                          </Badge>
                          <h3 className="text-xl font-semibold">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-600">
                              <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{detail}</span>
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

      {/* Order Statuses */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Statusurile comenzii</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderStatuses.map((status, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {status.icon}
                      <h3 className="font-semibold">{status.status}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{status.description}</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs border ${status.color}`}>
                      {status.status}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Metode de plată</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {paymentMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {method.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{method.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                    <div className="text-xs text-green-600 font-medium">
                      {method.security}
                    </div>
                  </CardContent>
                </Card>
              ))}
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

      {/* Contact Support */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ai întrebări despre comenzi?
            </h2>
            <p className="text-xl mb-8 opacity-90 text-white">
              Echipa noastră de suport este aici să te ajute cu orice întrebare despre 
              plasarea sau gestionarea comenzilor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
                asChild
              >
                <a href="mailto:support@floristmarket.ro">
                  <Mail className="h-4 w-4 mr-2" />
                  Contactează suportul
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <a href="tel:+40211234567">
                  <Phone className="h-4 w-4 mr-2" />
                  Sună-ne
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
