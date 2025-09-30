"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UITabs } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/lib/hooks/use-toast";
import { stagger, fadeInUp } from "@/components/motion";

// Form schemas
const checkoutSchema = z.object({
  email: z.string().email("Email invalid"),
  firstName: z.string().min(2, "Prenumele trebuie să aibă cel puțin 2 caractere"),
  lastName: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  phone: z.string().min(10, "Numărul de telefon trebuie să aibă cel puțin 10 cifre"),
  address: z.string().min(10, "Adresa trebuie să aibă cel puțin 10 caractere"),
  city: z.string().min(2, "Orașul trebuie să aibă cel puțin 2 caractere"),
  county: z.string().min(1, "Selectează județul"),
  paymentMethod: z.enum(["card", "cash", "transfer"], {
    message: "Selectează metoda de plată",
  }),
  terms: z.boolean().refine((val) => val === true, "Trebuie să accepți termenii și condițiile"),
  newsletter: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().min(3, "Numele produsului trebuie să aibă cel puțin 3 caractere"),
  description: z.string().min(10, "Descrierea trebuie să aibă cel puțin 10 caractere"),
  price: z.number().min(0.01, "Prețul trebuie să fie mai mare de 0"),
  category: z.string().min(1, "Selectează categoria"),
  inStock: z.boolean(),
  featured: z.boolean().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function FormsDemo() {
  const { showAddToCart, showSave, showError } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Checkout form
  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      county: "",
      paymentMethod: undefined,
      terms: false,
      newsletter: false,
    },
  });

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      inStock: true,
      featured: false,
    },
  });

  const onCheckoutSubmit = (data: CheckoutFormData) => {
    console.log("Checkout data:", data);
    showSave("Comanda a fost plasată cu succes!");
    checkoutForm.reset();
  };

  const onProductSubmit = (data: ProductFormData) => {
    console.log("Product data:", data);
    showSave("Produsul a fost salvat cu succes!");
    productForm.reset();
  };

  const handleAddToCart = () => {
    showAddToCart("Ghiveci ceramic alb");
  };

  const breadcrumbItems = [
    { name: "Demo", href: "/components-demo" },
    { name: "Formulare", href: "/forms-demo" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-8 min-h-screen bg-white dark:bg-slate-900"
        >
          <div className="space-y-4">
            <Breadcrumbs items={breadcrumbItems} />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Kit Formulare</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Formulare cu validare, toast notifications și componente reutilizabile
            </p>
          </div>

          {/* Toast Examples */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Toast Notifications</h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAddToCart}>
                Add to Cart Toast
              </Button>
              <Button variant="secondary" onClick={() => showSave("Setările au fost salvate!")}>
                Save Toast
              </Button>
              <Button variant="destructive" onClick={() => showError("A apărut o eroare!")}>
                Error Toast
              </Button>
            </div>
          </motion.section>

          {/* Tabs */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tabs</h2>
            <UITabs
              defaultValue="checkout"
              tabs={[
                {
                  value: "checkout",
                  label: "Checkout",
                  content: (
                <Card>
                  <CardHeader>
                    <CardTitle>Formular Checkout</CardTitle>
                    <CardDescription>
                      Completează datele pentru finalizarea comenzii
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...checkoutForm}>
                      <form onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={checkoutForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prenume</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ion" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={checkoutForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nume</FormLabel>
                                <FormControl>
                                  <Input placeholder="Popescu" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={checkoutForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="ion.popescu@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={checkoutForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <Input placeholder="0712345678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={checkoutForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresă</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Strada, numărul, blocul, scara, etajul, apartamentul" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={checkoutForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Oraș</FormLabel>
                                <FormControl>
                                  <Input placeholder="București" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={checkoutForm.control}
                            name="county"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Județ</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selectează județul" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="bucuresti">București</SelectItem>
                                    <SelectItem value="cluj">Cluj</SelectItem>
                                    <SelectItem value="timis">Timiș</SelectItem>
                                    <SelectItem value="constanta">Constanța</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={checkoutForm.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Metoda de plată</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="card" id="card" />
                                    <label htmlFor="card">Card bancar</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="cash" id="cash" />
                                    <label htmlFor="cash">Ramburs la livrare</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="transfer" id="transfer" />
                                    <label htmlFor="transfer">Transfer bancar</label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <FormField
                            control={checkoutForm.control}
                            name="terms"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Accept termenii și condițiile
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={checkoutForm.control}
                            name="newsletter"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel>Abonează-te la newsletter</FormLabel>
                                  <FormDescription>
                                    Primește oferte și noutăți pe email
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          Finalizează comanda
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                  ),
                },
                {
                  value: "product",
                  label: "Adaugă Produs",
                  content: (
                <Card>
                  <CardHeader>
                    <CardTitle>Adaugă Produs Nou</CardTitle>
                    <CardDescription>
                      Completează informațiile despre produs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...productForm}>
                      <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
                        <FormField
                          control={productForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nume produs</FormLabel>
                              <FormControl>
                                <Input placeholder="Ghiveci ceramic alb" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={productForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descriere</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descriere detaliată a produsului..." 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={productForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preț (RON)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="49.90" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={productForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categorie</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selectează categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ghivece">Ghivece</SelectItem>
                                    <SelectItem value="cutii">Cutii</SelectItem>
                                    <SelectItem value="accesorii">Accesorii</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={productForm.control}
                            name="inStock"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel>Disponibil în stoc</FormLabel>
                                  <FormDescription>
                                    Produsul este disponibil pentru comandă
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={productForm.control}
                            name="featured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel>Produs recomandat</FormLabel>
                                  <FormDescription>
                                    Afișează produsul în secțiunea recomandate
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          Salvează produsul
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                  ),
                },
              ]}
            />
          </motion.section>

          {/* Pagination */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Pagination</h2>
            <div className="space-y-4">
              <Pagination
                currentPage={currentPage}
                totalPages={10}
              />
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                Pagina curentă: {currentPage} din 10
              </p>
            </div>
          </motion.section>

          {/* Empty States */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Empty States</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    variant="search"
                    title="Nu am găsit rezultate"
                    description="Încearcă să modifici termenii de căutare"
                    action={{
                      label: "Resetează filtrele",
                      onClick: () => setSearchQuery(""),
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    variant="category"
                    title="Categorie goală"
                    description="Această categorie nu conține încă produse"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    variant="dashboard"
                    title="Dashboard gol"
                    description="Începe să adaugi conținut pentru a vedea statistici"
                    action={{
                      label: "Adaugă primul produs",
                      onClick: () => console.log("Add product"),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
