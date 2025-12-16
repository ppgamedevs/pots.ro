"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { H1, P } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RHFProvider, useZodForm, Field } from "@/components/ui/form-helpers";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/lib/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Truck, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import useSWR from "swr";
import type { Cart } from "@/lib/types";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SHIPPING_FEE_CENTS = 2500; // 25 RON

const countyOptions = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brăila", "Brașov", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța",
  "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita",
  "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș",
  "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava",
  "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea",
].map((c) => ({ value: c, label: c }));

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

  // Delivery (single, default)
  deliveryMethod: z.literal("courier"),

  // Payment
  paymentMethod: z.enum(["card", "revolut_pay"]),

  // Terms
  acceptTerms: z.boolean().refine((val) => val === true, "Trebuie să accepți termenii și condițiile"),
  acceptMarketing: z.boolean().optional(),

  // Notes
  notes: z.string().max(280, "Observațiile pot avea maxim 280 caractere").optional(),
});

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { data: cart, error: cartError, isLoading: cartLoading } = useSWR<Cart>("/api/cart", fetcher);

  const form = useZodForm(checkoutSchema, {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
    deliveryMethod: "courier",
    paymentMethod: "card",
    acceptTerms: false,
    acceptMarketing: false,
    notes: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const subtotalRON = cart?.totals?.subtotal ?? 0;
  const shippingRON = SHIPPING_FEE_CENTS / 100;
  const totalRON = useMemo(() => subtotalRON + shippingRON, [subtotalRON, shippingRON]);

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    setIsSubmitting(true);
    
    try {
      if (!cart || cart.items.length === 0) {
        toast("Coșul este gol. Adaugă produse înainte să finalizezi comanda.", "error");
        return;
      }

      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shippingChoice: {
            carrier: "Cargus",
            service: "Curier",
            fee_cents: SHIPPING_FEE_CENTS,
          },
          address: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            county: data.county,
            postalCode: data.postalCode,
            notes: data.notes,
          },
          paymentMethod: data.paymentMethod,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast("Trebuie să fii autentificat pentru a plasa comanda.", "error");
          return;
        }
        toast(payload?.error || "Nu s-a putut crea comanda. Încearcă din nou.", "error");
        return;
      }

      const payload = await res.json();
      toast("Comanda a fost creată. Continuăm către plată.", "success");
      router.push(`/finalizare/success?order_id=${encodeURIComponent(payload.order_id || "")}`);
      
    } catch (error) {
      toast("Eroare la plasarea comenzii. Te rugăm să încerci din nou.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-4">
        <Link href="/cos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la coș
          </Button>
        </Link>
        <H1>Finalizează comanda</H1>
      </div>
      <P className="mt-2 text-slate-600 dark:text-slate-300">
        Totul pe o singură pagină. Completează datele și confirmă plata.
      </P>

      <RHFProvider methods={form}>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date personale</CardTitle>
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
                    <Combobox
                      value={watch("county")}
                      onValueChange={(v) => form.setValue("county", v, { shouldValidate: true })}
                      options={countyOptions}
                      placeholder="Caută județ…"
                      emptyText="Nu am găsit județul"
                    />
                  </Field>
                  <Field label="Cod poștal" error={errors.postalCode?.message as string}>
                    <Input placeholder="010001" {...register("postalCode")} />
                  </Field>
                </div>
                <Field label="Observații (opțional)" error={errors.notes?.message as string} hint="Ex: interfon, etaj, interval orar">
                  <Textarea placeholder="Instrucțiuni speciale pentru livrare..." {...register("notes")} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Livrare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4 flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">Livrare prin curier</div>
                      <div className="text-sm font-semibold">{shippingRON.toFixed(2)} RON</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Curier: Cargus (la început). Livrare standard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plată</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field error={errors.paymentMethod?.message as string}>
                  <RadioGroup
                    value={watch("paymentMethod")}
                    onValueChange={(v) => form.setValue("paymentMethod", v as any, { shouldValidate: true })}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <label className="cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-micro">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="card" id="pay-card" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium">
                            <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            Card bancar
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Visa / Mastercard</p>
                        </div>
                      </div>
                    </label>

                    <label className="cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-micro">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="revolut_pay" id="pay-revolut" className="mt-1" />
                        <div className="flex-1">
                          <div className="font-medium">Revolut Pay</div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Plată rapidă cu Revolut</p>
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                </Field>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <Checkbox
                      checked={watch("acceptTerms")}
                      onCheckedChange={(v) => form.setValue("acceptTerms", v === true, { shouldValidate: true })}
                    />
                    <div className="text-sm">
                      <p>
                        Accept{" "}
                        <Link href="/termeni" className="text-primary hover:underline">
                          termenii și condițiile
                        </Link>{" "}
                        și{" "}
                        <Link href="/confidentialitate" className="text-primary hover:underline">
                          politica de confidențialitate
                        </Link>
                        .
                      </p>
                      {errors.acceptTerms && (
                        <p className="text-red-600 text-xs mt-1">{errors.acceptTerms.message as string}</p>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <Checkbox
                      checked={watch("acceptMarketing")}
                      onCheckedChange={(v) => form.setValue("acceptMarketing", v === true)}
                    />
                    <div className="text-sm">
                      <p>Vreau să primesc oferte și promoții prin email</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4" />
                <span>Plată securizată</span>
              </div>
              <Button type="submit" disabled={isSubmitting || cartLoading || !!cartError || !cart || cart.items.length === 0}>
                {isSubmitting ? "Se procesează..." : "Plasează comanda"}
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Sumar comandă</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartLoading ? (
                  <div className="text-sm text-slate-600 dark:text-slate-400">Se încarcă coșul…</div>
                ) : cartError ? (
                  <div className="text-sm text-red-600">Nu s-a putut încărca coșul.</div>
                ) : !cart || cart.items.length === 0 ? (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Coșul este gol. <Link href="/cautare" className="text-primary hover:underline">Caută produse</Link>.
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                            <Image
                              src={item.imageUrl || "/placeholder.png"}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-slate-500">Cantitate: {item.qty}</p>
                          </div>
                          <p className="text-sm font-medium">{(item.subtotal || item.unitPrice * item.qty).toFixed(2)} RON</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                        <span className="text-slate-900 dark:text-slate-100">{subtotalRON.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Livrare</span>
                        <span className="text-slate-900 dark:text-slate-100">{shippingRON.toFixed(2)} RON</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{totalRON.toFixed(2)} RON</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge variant="secondary">Livrare prin curier</Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </RHFProvider>
    </main>
  );
}
