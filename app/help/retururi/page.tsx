import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  Info,
  ArrowRight,
  Shield,
  Package,
  CreditCard,
  FileText,
  Calendar
} from "lucide-react";

export const metadata: Metadata = {
  title: "Retururi & Anulări - Help Center FloristMarket.ro",
  description: "Ghid complet pentru retururi și anulări: condiții, solicitare, aprobare și rambursare pe FloristMarket.",
  openGraph: {
    title: "Retururi & Anulări - Help Center FloristMarket.ro",
    description: "Ghid complet pentru retururi și anulări: condiții, solicitare, aprobare și rambursare pe FloristMarket.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/help/retururi'
  }
};

const returnConditions = [
  {
    title: "Produse în stare originală",
    description: "Produsele trebuie să fie în ambalajul original, cu etichetele și accesoriile incluse.",
    icon: <Package className="h-6 w-6" />,
    valid: true
  },
  {
    title: "Termen de 14 zile",
    description: "Ai 14 zile calendaristice de la primirea produsului pentru a solicita returul.",
    icon: <Calendar className="h-6 w-6" />,
    valid: true
  },
  {
    title: "Factura sau bonul",
    description: "Prezintă factura sau bonul de cumpărare pentru a demonstra achiziția.",
    icon: <FileText className="h-6 w-6" />,
    valid: true
  },
  {
    title: "Produse personalizate",
    description: "Produsele personalizate sau confecționate la comandă nu pot fi returnate.",
    icon: <AlertCircle className="h-6 w-6" />,
    valid: false
  }
];

const returnSteps = [
  {
    step: 1,
    title: "Solicitare retur",
    description: "Completează formularul de retur în contul tău sau contactează suportul.",
    icon: <FileText className="h-5 w-5" />,
    details: [
      "Accesează secțiunea 'Comenzile mele'",
      "Selectează comanda pentru retur",
      "Completează motivul returului",
      "Atașează fotografii dacă este necesar"
    ]
  },
  {
    step: 2,
    title: "Aprobare retur",
    description: "Echipa noastră verifică cererea și aprobă returul în maximum 24 de ore.",
    icon: <CheckCircle className="h-5 w-5" />,
    details: [
      "Verificarea condițiilor de retur",
      "Validarea termenului de 14 zile",
      "Confirmarea prin email",
      "Instrucțiuni pentru expediere"
    ]
  },
  {
    step: 3,
    title: "Expediere retur",
    description: "Expediază produsele folosind metodele indicate de echipa noastră.",
    icon: <Package className="h-5 w-5" />,
    details: [
      "Ambalarea produselor în siguranță",
      "Expedierea prin curier",
      "Obținerea AWB pentru urmărire",
      "Notificarea expedierii"
    ]
  },
  {
    step: 4,
    title: "Rambursare",
    description: "Primești rambursarea în contul de plată folosit pentru comandă.",
    icon: <CreditCard className="h-5 w-5" />,
    details: [
      "Verificarea produselor returnate",
      "Procesarea rambursării",
      "Confirmarea prin email",
      "Creditarea contului în 3-5 zile"
    ]
  }
];

const refundMethods = [
  {
    method: "Card bancar",
    time: "3-5 zile lucrătoare",
    description: "Rambursarea se face automat pe cardul folosit pentru plată",
    icon: <CreditCard className="h-6 w-6" />
  },
  {
    method: "PayPal",
    time: "1-3 zile lucrătoare",
    description: "Rambursarea rapidă în contul PayPal",
    icon: <Shield className="h-6 w-6" />
  },
  {
    method: "Revolut",
    time: "1-2 zile lucrătoare",
    description: "Rambursarea instantanee în contul Revolut",
    icon: <CheckCircle className="h-6 w-6" />
  }
];

const returnReasons = [
  {
    reason: "Produs defect",
    description: "Produsul prezintă defecte de fabricație sau a fost deteriorat în transport",
    refund: "100%",
    valid: true
  },
  {
    reason: "Produs diferit",
    description: "Produsul livrat nu corespunde cu cel comandat",
    refund: "100%",
    valid: true
  },
  {
    reason: "Schimbare de părere",
    description: "Nu mai dorești produsul sau ai găsit o alternativă mai bună",
    refund: "100%",
    valid: true
  },
  {
    reason: "Dimensiuni nepotrivite",
    description: "Produsul nu se potrivește spațiului destinat",
    refund: "100%",
    valid: true
  },
  {
    reason: "Produs personalizat",
    description: "Produsele personalizate nu pot fi returnate",
    refund: "0%",
    valid: false
  }
];

const faqs = [
  {
    question: "Cât timp am pentru a returna un produs?",
    answer: "Ai 14 zile calendaristice de la primirea produsului pentru a solicita returul conform legislației europene."
  },
  {
    question: "Cine plătește costurile de retur?",
    answer: "Dacă returul este din cauza unui defect sau eroare de livrare, noi plătim costurile. Pentru schimbarea de părere, clientul plătește costurile de retur."
  },
  {
    question: "Cât timp durează rambursarea?",
    answer: "Rambursarea se procesează în 3-5 zile lucrătoare după primirea și verificarea produselor returnate."
  },
  {
    question: "Pot anula o comandă înainte de livrare?",
    answer: "Da, poți anula comanda înainte de expediere fără costuri suplimentare. Contactează-ne cât mai repede."
  },
  {
    question: "Ce se întâmplă dacă produsul este deteriorat?",
    answer: "Dacă produsul ajunge deteriorat, fă fotografii și contactează-ne imediat. Vom procesa returul și rambursarea completă."
  }
];

export default function RetururiPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Retururi & Anulări
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Ghid complet pentru retururi și anulări pe FloristMarket. Învață condițiile, 
              pașii și procesul de rambursare pentru a face retururi fără probleme.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>14 zile pentru retur</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Rambursare garantată</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Proces simplu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Condiții pentru retur</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {returnConditions.map((condition, index) => (
                <Card key={index} className={`hover:shadow-lg transition-shadow ${condition.valid ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${condition.valid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {condition.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{condition.title}</h3>
                        <p className="text-gray-600 text-sm">{condition.description}</p>
                        <div className="mt-3">
                          <Badge variant={condition.valid ? "default" : "destructive"} className="text-xs">
                            {condition.valid ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Return Steps */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Pașii returului</h2>
            <div className="space-y-8">
              {returnSteps.map((step, index) => (
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

      {/* Refund Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Metode de rambursare</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {refundMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {method.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{method.method}</h3>
                    <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                    <div className="text-green-600 font-medium text-sm">
                      {method.time}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Return Reasons */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Motive pentru retur</h2>
            <div className="space-y-4">
              {returnReasons.map((reason, index) => (
                <Card key={index} className={`hover:shadow-lg transition-shadow ${reason.valid ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{reason.reason}</h3>
                        <p className="text-gray-600 text-sm">{reason.description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${reason.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {reason.refund}
                        </div>
                        <Badge variant={reason.valid ? "default" : "destructive"} className="text-xs">
                          {reason.valid ? "Acceptat" : "Refuzat"}
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
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ai întrebări despre retururi?
            </h2>
            <p className="text-xl mb-8 opacity-90 text-white">
              Echipa noastră de suport te ajută cu orice întrebare despre retururi, 
              anulări sau procesul de rambursare.
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
