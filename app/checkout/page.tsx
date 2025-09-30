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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RHFProvider, useZodForm, Field } from "@/components/ui/form-helpers";
import { useToast } from "@/lib/hooks/use-toast";
import { stagger, fadeInUp } from "@/components/motion";
import { CheckoutPageSkeleton } from "@/components/ui/loading-skeletons";
import { CheckoutErrorState, FormErrorState } from "@/components/ui/error-states";
import { ArrowLeft, CreditCard, Truck, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

// Form schema
const checkoutSchema = z.object({
  // Personal info
  firstName: z.string().min(2, "Prenumele trebuie să aibă minim 2 caractere"),
  lastName: z.string().min(2, "Numele trebuie să aibă minim 2 caractere"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(10, "Numărul de telefon trebuie să aibă minim 10 cifre"),
  
  // Address
  address: z.string().min(10, "Adresa trebuie să aibă minim 10 caractere"),
  city: z.string().min(2, "Orașul trebuie să aibă minim 2 caractere"),
  county: z.string().min(2, "Județul trebuie să aibă minim 2 caractere"),
  postalCode: z.string().min(5, "Codul poștal trebuie să aibă minim 5 caractere"),
  
  // Delivery
  deliveryMethod: z.string().min(1, "Selectează metoda de livrare"),
  deliveryDate: z.string().min(1, "Selectează data de livrare"),
  
  // Payment
  paymentMethod: z.string().min(1, "Selectează metoda de plată"),
  
  // Terms
  acceptTerms: z.boolean().refine(val => val === true, "Trebuie să accepți termenii și condițiile"),
  acceptMarketing: z.boolean().optional(),
  
  // Notes
  notes: z.string().optional(),
});

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
  }
];

const counties = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brăila", "Brașov", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța",
  "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita",
  "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș",
  "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava",
  "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"
];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useZodForm(checkoutSchema, {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
    deliveryMethod: "",
    deliveryDate: "",
    paymentMethod: "",
    acceptTerms: false,
    acceptMarketing: false,
    notes: "",
  });

  const { register, handleSubmit, formState: { errors }, watch } = form;

  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 25;
  const total = subtotal + shipping;

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast("Comandă plasată cu succes! Vei primi un email de confirmare în curând.");
      
      // Redirect to success page or clear cart
      console.log("Order data:", data);
      
    } catch (error) {
      toast("Eroare la plasarea comenzii. Te rugăm să încerci din nou.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: "Informații personale", description: "Datele tale de contact" },
    { id: 2, title: "Adresă de livrare", description: "Unde să livrăm comanda" },
    { id: 3, title: "Metode de livrare", description: "Cum să livrăm comanda" },
    { id: 4, title: "Plată", description: "Cum să plătești" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={[
          { name: "Acasă", href: "/" },
          { name: "Coș", href: "/cart" },
          { name: "Checkout", href: "/checkout" }
        ]} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-4 mb-4">
              <Link href="/cart">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Înapoi la coș
                </Button>
              </Link>
              <H1>Finalizează comanda</H1>
            </div>
            <P className="text-slate-600 dark:text-slate-300">
              Completează informațiile pentru a finaliza comanda
            </P>
          </motion.div>

          {/* Progress Steps */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-brand text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-brand" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-px mx-4 ${
                      currentStep > step.id ? "bg-brand" : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <RHFProvider methods={form}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
              {/* Checkout Form */}
              <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
                {/* Step 1: Personal Info */}
                {currentStep === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informații personale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Prenume" error={errors.firstName?.message as string}>
                          <Input placeholder="Ion" {...register("firstName")} />
                        </Field>
                        <Field label="Nume" error={errors.lastName?.message as string}>
                          <Input placeholder="Popescu" {...register("lastName")} />
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email" error={errors.email?.message as string}>
                          <Input type="email" placeholder="ion.popescu@email.com" {...register("email")} />
                        </Field>
                        <Field label="Telefon" error={errors.phone?.message as string}>
                          <Input placeholder="0712345678" {...register("phone")} />
                        </Field>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Address */}
                {currentStep === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Adresă de livrare</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Adresă completă" error={errors.address?.message as string}>
                        <Input placeholder="Strada Exemplu, nr. 123" {...register("address")} />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Oraș" error={errors.city?.message as string}>
                          <Input placeholder="București" {...register("city")} />
                        </Field>
                        <Field label="Județ" error={errors.county?.message as string}>
                          <Select {...register("county")}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează județul" />
                            </SelectTrigger>
                            <SelectContent>
                              {counties.map(county => (
                                <SelectItem key={county} value={county}>
                                  {county}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Cod poștal" error={errors.postalCode?.message as string}>
                          <Input placeholder="010001" {...register("postalCode")} />
                        </Field>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Delivery */}
                {currentStep === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Metode de livrare</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Metoda de livrare" error={errors.deliveryMethod?.message as string}>
                        <Select {...register("deliveryMethod")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează metoda de livrare" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Livrare standard (2-3 zile) - 25 RON</SelectItem>
                            <SelectItem value="express">Livrare express (1-2 zile) - 45 RON</SelectItem>
                            <SelectItem value="pickup">Ridicare din magazin - Gratuit</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Data preferată de livrare" error={errors.deliveryDate?.message as string}>
                        <Input type="date" {...register("deliveryDate")} />
                      </Field>
                      <Field label="Observații (opțional)" error={errors.notes?.message as string}>
                        <Textarea placeholder="Instrucțiuni speciale pentru livrare..." {...register("notes")} />
                      </Field>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Metoda de plată</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Metoda de plată" error={errors.paymentMethod?.message as string}>
                        <Select {...register("paymentMethod")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează metoda de plată" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Card bancar</SelectItem>
                            <SelectItem value="transfer">Transfer bancar</SelectItem>
                            <SelectItem value="cash">Ramburs la livrare</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={watch("acceptTerms")}
                            onChange={(checked) => form.setValue("acceptTerms", checked)}
                          />
                          <div className="text-sm">
                            <p>Accept <Link href="/termeni" className="text-brand hover:underline">termenii și condițiile</Link> și <Link href="/gdpr" className="text-brand hover:underline">politica de confidențialitate</Link></p>
                            {errors.acceptTerms && (
                              <p className="text-red-600 text-xs mt-1">{errors.acceptTerms.message as string}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={watch("acceptMarketing")}
                            onChange={(checked) => form.setValue("acceptMarketing", checked)}
                          />
                          <div className="text-sm">
                            <p>Vreau să primesc oferte și promoții prin email</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                  >
                    Înapoi
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                    >
                      Următorul pas
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? "Se procesează..." : "Plasează comanda"}
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Order Summary */}
              <motion.div variants={fadeInUp}>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Sumar comandă</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {mockCartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                            <OptimizedImage
                              src={item.image}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-slate-500">Cantitate: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            {(item.price * item.quantity).toFixed(2)} RON
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
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
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{total.toFixed(2)} RON</span>
                        </div>
                      </div>
                    </div>

                    {/* Security badges */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <Shield className="h-3 w-3" />
                        <span>Plată securizată</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <Truck className="h-3 w-3" />
                        <span>Livrare rapidă</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </RHFProvider>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
