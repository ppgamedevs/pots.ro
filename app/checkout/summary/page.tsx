import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H1, H2 } from "@/components/ui/typography";
import MerchantDisclosure from "@/components/checkout/MerchantDisclosure";
import { CreditCard, Truck, Shield } from "lucide-react";

// Mock data pentru checkout
const mockOrder = {
  items: [
    {
      id: 1,
      title: "Ghiveci ceramic alb",
      price: 49.90,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 2,
      title: "Vază sticlă înaltă",
      price: 89.90,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center"
    }
  ],
  subtotal: 139.80,
  shipping: 15.00,
  total: 154.80,
  merchant: {
    name: "Atelier Ceramic SRL",
    cui: "RO12345678"
  }
};

export default function CheckoutSummaryPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <H1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            Rezumat comandă
          </H1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detalii comandă */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produse în comandă</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {item.title}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Cantitate: {item.quantity}
                          </div>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {item.price.toFixed(2)} RON
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Informații despre comerciant - DEZVĂLUIRE LEGALĂ */}
              <MerchantDisclosure merchant={mockOrder.merchant} />

              {/* Metode de plată */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Metodă de plată
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-600 dark:text-slate-400">
                    Card bancar (Visa, Mastercard)
                  </div>
                </CardContent>
              </Card>

              {/* Livrare */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Livrare
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-600 dark:text-slate-400">
                    Livrare standard: 2-3 zile lucrătoare
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rezumat preț */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Rezumat preț</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {mockOrder.subtotal.toFixed(2)} RON
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Livrare</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {mockOrder.shipping.toFixed(2)} RON
                      </span>
                    </div>
                    <hr className="border-slate-200 dark:border-slate-700" />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-slate-900 dark:text-slate-100">Total</span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {mockOrder.total.toFixed(2)} RON
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buton finalizare comandă */}
              <div className="mt-6">
                <Button 
                  className="w-full py-3 text-lg"
                  disabled
                  title="Disponibil în curând (MVP)"
                >
                  <span className="group-hover:hidden">Plasează comanda</span>
                  <span className="hidden group-hover:inline">MVP</span>
                </Button>
              </div>

              {/* Garanții */}
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Shield className="h-4 w-4" />
                    <span>Plata securizată • Retur 30 zile • Garanție 2 ani</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
