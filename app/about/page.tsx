import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Despre noi - Pots.ro",
  description: "Descoperă povestea Pots.ro - platforma ta de încredere pentru ghivece și accesorii florale.",
  openGraph: {
    title: "Despre noi - Pots.ro",
    description: "Descoperă povestea Pots.ro - platforma ta de încredere pentru ghivece și accesorii florale.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Despre Pots.ro</h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Misiunea noastră</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pots.ro este platforma ta de încredere pentru ghivece și accesorii florale. 
                Ne-am propus să conectăm vânzătorii de calitate cu clienții pasionați de grădinărit 
                și decor floral, oferind o experiență de cumpărături simplă și sigură.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Ce oferim</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">Produse de calitate</h3>
                  <p className="text-muted-foreground">
                    Ghivece ceramice, cutii decorative, accesorii florale și multe altele, 
                    toate verificate pentru calitate și durabilitate.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Vânzători verificați</h3>
                  <p className="text-muted-foreground">
                    Colaborăm doar cu vânzători responsabili și verificați, 
                    pentru a-ți oferi încredere în fiecare achiziție.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Livrare sigură</h3>
                  <p className="text-muted-foreground">
                    Sistem de livrare optimizat cu parteneri de încredere, 
                    pentru ca produsele să ajungă în siguranță la tine.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Suport dedicat</h3>
                  <p className="text-muted-foreground">
                    Echipa noastră de suport este aici să te ajute cu orice întrebare 
                    sau problemă pe care o ai.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">De ce să alegi Pots.ro?</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Produse verificate pentru calitate și siguranță</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Vânzători responsabili și verificați</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Proces de comandă simplu și sigur</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Suport clienți dedicat</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Politici clare de retur și garanție</span>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact</h2>
              <p className="text-muted-foreground mb-4">
                Ai întrebări sau sugestii? Suntem aici să te ajutăm!
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-medium mb-2">Email: contact@pots.ro</p>
                <p className="font-medium mb-2">Suport: help@pots.ro</p>
                <p className="text-sm text-muted-foreground">
                  Răspundem în maximum 24 de ore în zilele lucrătoare.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
