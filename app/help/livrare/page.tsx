import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Shield,
  Calendar,
  Navigation
} from "lucide-react";

export const metadata: Metadata = {
  title: "Livrare - Help Center FloristMarket.ro",
  description: "Informații complete despre livrare: curieri, termene estimate, urmărire colet și costuri de livrare pe FloristMarket.",
  openGraph: {
    title: "Livrare - Help Center FloristMarket.ro",
    description: "Informații complete despre livrare: curieri, termene estimate, urmărire colet și costuri de livrare pe FloristMarket.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/help/livrare'
  }
};

const couriers = [
  {
    name: "Fan Courier",
    logo: "/partners/fan-courier.png",
    deliveryTime: "1-2 zile lucrătoare",
    coverage: "Toată România",
    features: [
      "Livrare la domiciliu",
      "Livrare la punct de ridicare",
      "Urmărire în timp real",
      "SMS și email notificări"
    ],
    cost: "15-25 RON",
    tracking: "https://www.fancourier.ro/tracking"
  },
  {
    name: "DPD",
    logo: "/partners/dpd.png",
    deliveryTime: "1-3 zile lucrătoare",
    coverage: "Toată România",
    features: [
      "Livrare programată",
      "Opțiuni de livrare flexibile",
      "Notificări push",
      "Geofencing pentru livrare"
    ],
    cost: "18-30 RON",
    tracking: "https://tracking.dpd.ro"
  },
  {
    name: "Cargus",
    logo: "/partners/cargus.png",
    deliveryTime: "2-4 zile lucrătoare",
    coverage: "Toată România",
    features: [
      "Livrare la domiciliu",
      "Puncte de ridicare extinse",
      "Urmărire detaliată",
      "Asigurare inclusă"
    ],
    cost: "12-20 RON",
    tracking: "https://www.cargus.ro/tracking"
  },
  {
    name: "Sameday",
    logo: "/partners/sameday.png",
    deliveryTime: "În aceeași zi",
    coverage: "București și orașe mari",
    features: [
      "Livrare în aceeași zi",
      "Livrare express",
      "Notificări instant",
      "Tracking live"
    ],
    cost: "25-45 RON",
    tracking: "https://www.sameday.ro/tracking"
  }
];

const deliveryZones = [
  {
    zone: "București",
    deliveryTime: "1-2 zile",
    cost: "15-20 RON",
    description: "Livrare rapidă în toate sectoarele Bucureștiului"
  },
  {
    zone: "Orașe mari",
    deliveryTime: "2-3 zile",
    cost: "18-25 RON",
    description: "Cluj, Timișoara, Iași, Constanța, Brașov"
  },
  {
    zone: "Orașe medii",
    deliveryTime: "3-4 zile",
    cost: "20-30 RON",
    description: "Orașe de peste 50.000 locuitori"
  },
  {
    zone: "Zone rurale",
    deliveryTime: "4-5 zile",
    cost: "25-35 RON",
    description: "Sate și comune din toată țara"
  }
];

const deliveryOptions = [
  {
    name: "Livrare standard",
    description: "Livrare la domiciliu în intervalul 9:00-18:00",
    icon: <Truck className="h-6 w-6" />,
    time: "1-3 zile",
    cost: "15-25 RON"
  },
  {
    name: "Livrare programată",
    description: "Alege data și intervalul orar pentru livrare",
    icon: <Calendar className="h-6 w-6" />,
    time: "Conform programării",
    cost: "+5 RON"
  },
  {
    name: "Livrare la punct",
    description: "Ridicare din punctele de livrare ale curierului",
    icon: <MapPin className="h-6 w-6" />,
    time: "1-2 zile",
    cost: "Gratuit"
  },
  {
    name: "Livrare express",
    description: "Livrare în aceeași zi sau următoarea zi",
    icon: <Navigation className="h-6 w-6" />,
    time: "În aceeași zi",
    cost: "25-45 RON"
  }
];

const trackingSteps = [
  {
    step: 1,
    title: "Primirea AWB",
    description: "Primești numărul AWB prin email și SMS după expediere.",
    icon: <Mail className="h-5 w-5" />
  },
  {
    step: 2,
    title: "Urmărire online",
    description: "Folosește numărul AWB pentru a urmări coletul în timp real.",
    icon: <Package className="h-5 w-5" />
  },
  {
    step: 3,
    title: "Notificări",
    description: "Primești actualizări despre statusul comenzii prin SMS și email.",
    icon: <CheckCircle className="h-5 w-5" />
  },
  {
    step: 4,
    title: "Livrare",
    description: "Coletul ajunge la destinație și primești confirmarea livrării.",
    icon: <Truck className="h-5 w-5" />
  }
];

const faqs = [
  {
    question: "Cât costă livrarea?",
    answer: "Costul livrării variază între 15-45 RON în funcție de curier, destinație și tipul de livrare ales. Livrarea la punct este gratuită."
  },
  {
    question: "Cât timp durează livrarea?",
    answer: "Livrarea standard durează 1-3 zile lucrătoare în București și 2-5 zile în restul țării, în funcție de destinație."
  },
  {
    question: "Pot urmări coletul?",
    answer: "Da, primești un număr AWB prin email și poți urmări coletul pe site-ul curierului sau în contul tău FloristMarket."
  },
  {
    question: "Ce se întâmplă dacă nu sunt acasă?",
    answer: "Curierul va încerca livrarea din nou sau va lăsa coletul la un punct de ridicare din apropiere. Vei fi notificat despre noua locație."
  },
  {
    question: "Pot schimba adresa de livrare?",
    answer: "Da, poți modifica adresa de livrare înainte de expediere. Contactează-ne cât mai repede pentru a face modificarea."
  }
];

export default function LivrarePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Informații despre livrare
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Descoperă toate detaliile despre livrare pe FloristMarket: curieri parteneri, 
              termene estimate, costuri și opțiuni de urmărire pentru comenzile tale.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>4 curieri parteneri</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Livrare 1-5 zile</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Toată România</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Opțiuni de livrare</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {deliveryOptions.map((option, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {option.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{option.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{option.description}</p>
                    <div className="space-y-1 text-xs">
                      <div className="text-blue-600 font-medium">{option.time}</div>
                      <div className="text-green-600 font-medium">{option.cost}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Couriers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Curierii noștri parteneri</h2>
            <div className="space-y-6">
              {couriers.map((courier, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-8 w-8 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{courier.name}</h3>
                            <p className="text-gray-600">{courier.coverage}</p>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2">Caracteristici:</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                              {courier.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Timp livrare:</span>
                                <span className="font-medium">{courier.deliveryTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cost:</span>
                                <span className="font-medium text-green-600">{courier.cost}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Urmărire
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4 mr-2" />
                          Detalii
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

      {/* Delivery Zones */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Zone de livrare</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {deliveryZones.map((zone, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{zone.zone}</h3>
                    <p className="text-gray-600 text-sm mb-4">{zone.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timp:</span>
                        <span className="font-medium text-blue-600">{zone.deliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-medium text-green-600">{zone.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Cum urmărești coletul</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trackingSteps.map((step, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        {step.icon}
                      </div>
                    </div>
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        Pasul {step.step}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
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
            <h2 className="text-3xl font-bold mb-4">
              Ai întrebări despre livrare?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Echipa noastră de suport te ajută cu orice întrebare despre livrare, 
              urmărire sau modificarea adresei de livrare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contactează suportul
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                <Phone className="h-4 w-4 mr-2" />
                Sună-ne
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
