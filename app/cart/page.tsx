"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { H1, H2, P } from "@/components/ui/typography";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { stagger, fadeInUp } from "@/components/motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock cart data
const mockCartItems = [
  {
    id: 1,
    title: "Ghiveci ceramic alb",
    price: 49.9,
    currency: "RON",
    image: "/placeholder.png",
    quantity: 2,
    seller: "Atelier Ceramic",
    slug: "ghiveci-ceramic-alb"
  },
  {
    id: 2,
    title: "Cutie înaltă natur",
    price: 79.0,
    currency: "RON",
    image: "/placeholder.png",
    quantity: 1,
    seller: "Cardboard Street",
    slug: "cutie-inalta-nevopsita"
  },
  {
    id: 3,
    title: "Panglică satin 25mm",
    price: 14.5,
    currency: "RON",
    image: "/placeholder.png",
    quantity: 3,
    seller: "Accesorii Florale",
    slug: "panglica-satin"
  }
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const { toast } = useToast();

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast("Produs eliminat din coș");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 25; // Free shipping over 200 RON
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Breadcrumbs items={[
            { label: "Acasă", href: "/" },
            { label: "Coș" }
          ]} />
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center py-16"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <ShoppingBag className="h-24 w-24 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <H1>Coșul tău este gol</H1>
              <P className="text-slate-600 dark:text-slate-300 mt-2">
                Adaugă produse în coș pentru a continua cu cumpărăturile.
              </P>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <Link href="/">
                <Button size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continuă cumpărăturile
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={[
          { label: "Acasă", href: "/" },
          { label: "Coș" }
        ]} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <H1>Coșul tău</H1>
            <P className="text-slate-600 dark:text-slate-300">
              {cartItems.length} produse în coș
            </P>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="h-20 w-20 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        <OptimizedImage
                          src={item.image}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/p/${item.id}-${item.slug}`}>
                          <h3 className="font-medium hover:text-brand transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Vândut de {item.seller}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-semibold">
                            {item.price.toFixed(2)} {item.currency}
                          </span>
                          <Badge variant="secondary">
                            {item.quantity} buc
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Order Summary */}
            <motion.div variants={fadeInUp}>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Sumar comandă</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livrare</span>
                      <span>
                        {shipping === 0 ? (
                          <Badge variant="secondary">Gratuită</Badge>
                        ) : (
                          `${shipping.toFixed(2)} RON`
                        )}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Adaugă {(200 - subtotal).toFixed(2)} RON pentru livrare gratuită
                      </p>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{total.toFixed(2)} RON</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link href="/checkout" className="w-full">
                      <Button className="w-full" size="lg">
                        Continuă la plată
                      </Button>
                    </Link>
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full">
                        Continuă cumpărăturile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
