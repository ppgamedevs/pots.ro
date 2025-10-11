import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  User, 
  Mail, 
  MapPin, 
  FileText, 
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Heart,
  Users,
  TrendingUp
} from "lucide-react";

export const metadata: Metadata = {
  title: "Aplică pentru un job - Cariere FloristMarket.ro",
  description: "Aplică pentru unul din posturile disponibile la FloristMarket. Trimite CV-ul tău și alătură-te echipei noastre.",
  openGraph: {
    title: "Aplică pentru un job - Cariere FloristMarket.ro",
    description: "Aplică pentru unul din posturile disponibile la FloristMarket. Trimite CV-ul tău și alătură-te echipei noastre.",
  },
  alternates: {
    canonical: 'https://floristmarket.ro/cariere/aplica'
  }
};

const jobPositions = [
  {
    id: "frontend-dev",
    title: "Frontend Developer",
    department: "Tehnologie",
    location: "București / Remote",
    type: "Full-time"
  },
  {
    id: "backend-dev", 
    title: "Backend Developer",
    department: "Tehnologie",
    location: "București / Remote",
    type: "Full-time"
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager", 
    department: "Marketing",
    location: "București",
    type: "Full-time"
  },
  {
    id: "customer-success",
    title: "Customer Success Specialist",
    department: "Suport Clienți", 
    location: "București / Remote",
    type: "Full-time"
  },
  {
    id: "general",
    title: "Alte posturi",
    department: "General",
    location: "Flexibil",
    type: "Flexibil"
  }
];

const benefits = [
  {
    icon: <Heart className="h-6 w-6 text-red-500" />,
    title: "Pasiune pentru natură",
    description: "Lucrezi într-un mediu care respectă și promovează sustenabilitatea"
  },
  {
    icon: <Users className="h-6 w-6 text-blue-500" />,
    title: "Echipa unită",
    description: "Colaborare strânsă și suport reciproc în toate proiectele"
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-green-500" />,
    title: "Crescere profesională",
    description: "Oportunități de dezvoltare și învățare continuă"
  }
];

export default function AplicaPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la cariere
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Aplică pentru un job la FloristMarket
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Alătură-te echipei noastre și ajută-ne să construim viitorul floristicii în România. 
              Completează formularul de mai jos și trimite-ne CV-ul tău.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Proces rapid</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Echipa prietenoasă</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Oportunități de creștere</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Formular de aplicare</CardTitle>
                    <p className="text-gray-600">
                      Completează toate câmpurile pentru a-ți trimite candidatura
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Informații personale
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">Prenume *</Label>
                            <Input 
                              id="firstName" 
                              placeholder="Introdu prenumele tău"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Nume *</Label>
                            <Input 
                              id="lastName" 
                              placeholder="Introdu numele tău"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input 
                            id="email" 
                            type="email"
                            placeholder="adresa.ta@email.com"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">Telefon *</Label>
                          <Input 
                            id="phone" 
                            type="tel"
                            placeholder="+40 123 456 789"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="location">Locația *</Label>
                          <Input 
                            id="location" 
                            placeholder="București, România"
                            required
                          />
                        </div>
                      </div>

                      {/* Job Position */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Postul pentru care aplici
                        </h3>
                        
                        <div>
                          <Label htmlFor="position">Selectează postul *</Label>
                          <select 
                            id="position" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          >
                            <option value="">Alege un post...</option>
                            {jobPositions.map((position) => (
                              <option key={position.id} value={position.id}>
                                {position.title} - {position.department} ({position.location})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Experiență profesională</h3>
                        
                        <div>
                          <Label htmlFor="experience">Ani de experiență</Label>
                          <select 
                            id="experience" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Selectează...</option>
                            <option value="0-1">0-1 ani</option>
                            <option value="1-3">1-3 ani</option>
                            <option value="3-5">3-5 ani</option>
                            <option value="5-10">5-10 ani</option>
                            <option value="10+">10+ ani</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="currentPosition">Postul actual (opțional)</Label>
                          <Input 
                            id="currentPosition" 
                            placeholder="ex: Frontend Developer la Compania X"
                          />
                        </div>
                      </div>

                      {/* Motivation */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          De ce vrei să lucrezi cu noi?
                        </h3>
                        
                        <div>
                          <Label htmlFor="motivation">Mesajul tău *</Label>
                          <Textarea 
                            id="motivation" 
                            placeholder="Spune-ne de ce te interesează să lucrezi la FloristMarket, ce te pasionează și cum crezi că poți contribui la echipa noastră..."
                            rows={6}
                            required
                          />
                        </div>
                      </div>

                      {/* CV Upload */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          CV-ul tău
                        </h3>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Încarcă CV-ul tău</p>
                            <p className="text-gray-600 text-sm">
                              Formate acceptate: PDF, DOC, DOCX (max. 5MB)
                            </p>
                            <Button variant="outline" className="mt-4">
                              <Upload className="h-4 w-4 mr-2" />
                              Alege fișierul
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-6">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-3">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Trimite aplicația
                        </Button>
                        <p className="text-sm text-gray-500 mt-3 text-center">
                          Prin trimiterea acestui formular, confirmi că informațiile furnizate sunt corecte și complete.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>De ce să lucrezi cu noi?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {benefit.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{benefit.title}</h4>
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Procesul de recrutare</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <span className="text-sm">Trimite aplicația</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <span className="text-sm">Screening inițial</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <span className="text-sm">Interviu tehnic</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                      <span className="text-sm">Oferta de angajare</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>hr@floristmarket.ro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>București, România</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Răspundem la toate aplicațiile în maximum 5 zile lucrătoare.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
