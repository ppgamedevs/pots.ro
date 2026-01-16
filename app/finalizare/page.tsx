"use client";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { H1, P } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RHFProvider, useZodForm, Field } from "@/components/ui/form-helpers";
import { Controller, useFormContext } from "react-hook-form";
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

const countyOptions = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brăila", "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța",
  "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita",
  "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș",
  "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava",
  "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea",
].map((c) => ({ value: c, label: c }));

function PersonTypeSelector({ value, onChange, error }: { value: "fizica" | "juridica"; onChange: (value: "fizica" | "juridica") => void; error?: string }) {
  return (
    <Field error={error}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-micro ${
            value === "fizica"
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name="personType"
            value="fizica"
            checked={value === "fizica"}
            onChange={() => onChange("fizica")}
            className="mt-1 h-4 w-4 cursor-pointer accent-primary"
          />
          <div className="flex-1">
            <div className="font-medium">Persoană fizică</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cumpăr pentru uz personal</p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-micro ${
            value === "juridica"
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name="personType"
            value="juridica"
            checked={value === "juridica"}
            onChange={() => onChange("juridica")}
            className="mt-1 h-4 w-4 cursor-pointer accent-primary"
          />
          <div className="flex-1">
            <div className="font-medium">Persoană juridică</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cumpăr pentru firmă</p>
          </div>
        </label>
      </div>
    </Field>
  );
}

const checkoutSchema = z.object({
  // Person type
  personType: z.enum(["fizica", "juridica"]),

  // Personal info
  firstName: z.string().min(2, "Prenumele trebuie să aibă minim 2 caractere"),
  lastName: z.string().min(2, "Numele trebuie să aibă minim 2 caractere"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(10, "Numărul de telefon trebuie să aibă minim 10 cifre"),

  // Company info (for juridica)
  companyName: z.string().optional(),
  cui: z.string().optional(),
  regCom: z.string().optional(),

  // Address
  address: z.string().min(10, "Adresa trebuie să aibă minim 10 caractere"),
  city: z.string().min(2, "Orașul trebuie să aibă minim 2 caractere"),
  county: z.string().min(2, "Județul trebuie să aibă minim 2 caractere"),
  postalCode: z.string().min(5, "Codul poștal trebuie să aibă minim 5 caractere"),

  // Delivery (single, default)
  deliveryMethod: z.literal("courier"),

  // Payment
  paymentMethod: z.literal("card"),
  // Card details (optional - required only if no saved card is selected)
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  cardholderName: z.string().optional(),
  saveCard: z.enum(["save", "no-save"]).optional(),
  savedCardId: z.string().optional(), // ID of saved card to use

  // Terms
  acceptTerms: z.boolean().refine((val) => val === true, "Trebuie să accepți termenii și condițiile"),
  acceptMarketing: z.boolean().optional(),

  // Notes
  notes: z.string().max(280, "Observațiile pot avea maxim 280 caractere").optional(),
}).refine((data) => {
  // If juridica, company fields are required
  if (data.personType === "juridica") {
    return data.companyName && data.companyName.length >= 2 &&
           data.cui && data.cui.length >= 2 &&
           data.regCom && data.regCom.length >= 2;
  }
  return true;
}, {
  message: "Pentru persoane juridice, toate câmpurile companiei sunt obligatorii",
  path: ["companyName"],
}).refine((data) => {
  // Card validation: either savedCardId is set, OR all card fields are provided
  // Only validate if user has started filling card fields (at least one field has value)
  const hasSavedCard = data.savedCardId && data.savedCardId.length > 0;
  const cardNumber = data.cardNumber?.replace(/\s/g, '') || '';
  const hasAnyCardField = cardNumber.length > 0 || data.cardExpiry || data.cardCvv || data.cardholderName;
  
  // If no saved card and user hasn't started filling card fields, don't validate yet
  if (!hasSavedCard && !hasAnyCardField) {
    return true; // Allow empty state until user starts filling
  }
  
  // If user started filling, validate all fields
  const hasCardNumber = cardNumber.length >= 13;
  const hasCardExpiry = data.cardExpiry && /^\d{2}\/\d{2}$/.test(data.cardExpiry);
  const hasCardCvv = data.cardCvv && data.cardCvv.length >= 3;
  const hasCardholderName = data.cardholderName && data.cardholderName.length >= 2;
  
  const hasAllCardFields = hasCardNumber && hasCardExpiry && hasCardCvv && hasCardholderName;
  
  return hasSavedCard || hasAllCardFields;
}, {
  message: "Completează toate câmpurile cardului bancar sau selectează un card salvat",
  path: ["cardNumber"],
});

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personType, setPersonType] = useState<"fizica" | "juridica">("fizica");
  const [showCardForm, setShowCardForm] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const { data: cart, error: cartError, isLoading: cartLoading } = useSWR<Cart>("/api/cart", fetcher);
  const { data: shippingFeeData } = useSWR<{ shippingFeeCents: number; shippingFeeRON: number }>("/api/settings/shipping-fee", fetcher);
  const { data: savedCardsData, mutate: mutateSavedCards } = useSWR<{ cards: Array<{
    id: string;
    last4Digits: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    cardholderName: string | null;
    isDefault: boolean;
  }> }>("/api/payment-cards", fetcher);

  const form = useZodForm(checkoutSchema, {
    personType: "fizica",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    cui: "",
    regCom: "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
    deliveryMethod: "courier",
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardholderName: "",
    saveCard: "no-save",
    savedCardId: undefined,
    acceptTerms: false,
    acceptMarketing: false,
    notes: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = form;

  // Set default saved card if available
  useEffect(() => {
    if (savedCardsData?.cards && savedCardsData.cards.length > 0 && !savedCardId) {
      const defaultCard = savedCardsData.cards.find(c => c.isDefault) || savedCardsData.cards[0];
      if (defaultCard) {
        setSavedCardId(defaultCard.id);
        setValue("savedCardId", defaultCard.id);
      }
    }
  }, [savedCardsData, savedCardId, setValue]);



  const subtotalRON = cart?.totals?.subtotal ?? 0;
  const SHIPPING_FEE_CENTS = shippingFeeData?.shippingFeeCents ?? 2500; // Default to 25 RON
  const shippingRON = SHIPPING_FEE_CENTS / 100;
  const totalRON = useMemo(() => subtotalRON + shippingRON, [subtotalRON, shippingRON]);

  // Helper function to detect card brand from number
  const detectCardBrand = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return 'unknown';
  };

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    // Validate card before submitting
    const hasSavedCard = savedCardId || data.savedCardId;
    const hasCardNumber = data.cardNumber && data.cardNumber.replace(/\s/g, '').length >= 13;
    const hasCardExpiry = data.cardExpiry && /^\d{2}\/\d{2}$/.test(data.cardExpiry);
    const hasCardCvv = data.cardCvv && data.cardCvv.length >= 3;
    const hasCardholderName = data.cardholderName && data.cardholderName.length >= 2;
    const hasAllCardFields = hasCardNumber && hasCardExpiry && hasCardCvv && hasCardholderName;
    
    if (!hasSavedCard && !hasAllCardFields) {
      toast("Completează toate câmpurile cardului bancar sau selectează un card salvat.", "error");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!cart || cart.items.length === 0) {
        toast("Coșul este gol. Adaugă produse înainte să finalizezi comanda.", "error");
        setIsSubmitting(false);
        return;
      }

      // Save card if user selected "save" and provided card details
      if (data.saveCard === "save" && data.cardNumber && !savedCardId) {
        try {
          const cardNumber = data.cardNumber.replace(/\s/g, '');
          const last4Digits = cardNumber.slice(-4);
          const brand = detectCardBrand(cardNumber);
          const [expiryMonth, expiryYear] = (data.cardExpiry || '').split('/').map(v => parseInt(v, 10));
          
          // Add 2000 to year if it's 2 digits (e.g., 25 -> 2025)
          const fullYear = expiryYear < 100 ? 2000 + expiryYear : expiryYear;

          const isFirstCard = !savedCardsData?.cards || savedCardsData.cards.length === 0;
          await fetch("/api/payment-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              last4Digits,
              brand,
              expiryMonth,
              expiryYear: fullYear,
              cardholderName: data.cardholderName || null,
              isDefault: isFirstCard, // Set as default only if it's the first card
            }),
          });
          
          // Refresh saved cards list and close form
          const refreshedData = await mutateSavedCards();
          setShowCardForm(false);
          
          // Find the newly saved card and set it as selected
          if (refreshedData?.cards && refreshedData.cards.length > 0) {
            const newCard = refreshedData.cards.find((c: any) => c.last4Digits === last4Digits);
            if (newCard) {
              setSavedCardId(newCard.id);
              setValue("savedCardId", newCard.id);
            }
          }
        } catch (cardError) {
          console.error('Error saving card:', cardError);
          // Don't block checkout if card saving fails
          toast("Cardul nu a putut fi salvat, dar comanda va continua.", "warning");
        }
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
          savedCardId: savedCardId || data.savedCardId || undefined,
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
      // Redirect directly to payment page using friendly order number
      const orderRef = payload.order_number || payload.order_id || "";
      router.push(`/finalizare/pay?order_id=${encodeURIComponent(orderRef)}`);
      
    } catch (error) {
      toast("Eroare la plasarea comenzii. Te rugăm să încerci din nou.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la coș
          </Button>
        </Link>
        <H1>Finalizează comanda</H1>
      </div>

      <RHFProvider methods={form}>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Summary - moved to top */}
          <div className="lg:col-span-1 order-1 lg:order-2">
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
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="48px"
                                onError={(e) => {
                                  // Fallback to placeholder on error
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.png';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                No img
                              </div>
                            )}
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

          {/* Form */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Person Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Tip persoană</CardTitle>
              </CardHeader>
              <CardContent>
                <PersonTypeSelector 
                  value={personType}
                  onChange={(v) => {
                    setPersonType(v);
                    setValue("personType", v, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }}
                  error={errors.personType?.message as string}
                />
              </CardContent>
            </Card>

            {/* Personal/Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>{watch("personType") === "juridica" ? "Date companie" : "Date personale"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {watch("personType") === "juridica" && (
                  <>
                    <Field label="Nume companie" error={errors.companyName?.message as string}>
                      <Input placeholder="SC Exemplu SRL" {...register("companyName")} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="CUI" error={errors.cui?.message as string}>
                        <Input placeholder="RO12345678" {...register("cui")} />
                      </Field>
                      <Field label="Nr. Registru Comerțului" error={errors.regCom?.message as string}>
                        <Input placeholder="J40/1234/2020" {...register("regCom")} />
                      </Field>
                    </div>
                  </>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`${watch("personType") === "juridica" ? "Prenume persoană contact" : "Prenume"} *`} error={errors.firstName?.message as string}>
                    <Input placeholder="Ion" {...register("firstName")} />
                  </Field>
                  <Field label={`${watch("personType") === "juridica" ? "Nume persoană contact" : "Nume"} *`} error={errors.lastName?.message as string}>
                    <Input placeholder="Popescu" {...register("lastName")} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email *" error={errors.email?.message as string}>
                    <Input type="email" placeholder="ion.popescu@email.com" {...register("email")} />
                  </Field>
                  <Field label="Telefon *" error={errors.phone?.message as string}>
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
                <Field label="Adresă completă *" error={errors.address?.message as string}>
                  <Input placeholder="Strada Exemplu, nr. 123" {...register("address")} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Oraș *" error={errors.city?.message as string}>
                    <Input placeholder="București" {...register("city")} />
                  </Field>
                  <Field label="Județ *" error={errors.county?.message as string}>
                    <Combobox
                      value={watch("county")}
                      onValueChange={(v) => form.setValue("county", v, { shouldValidate: true })}
                      options={countyOptions}
                      placeholder="Caută județ…"
                      emptyText="Nu am găsit județul"
                    />
                  </Field>
                  <Field label="Cod poștal *" error={errors.postalCode?.message as string}>
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
                      Curier: Cargus. Livrare standard.
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
                {/* Saved Card Display or Add Card Button */}
                {savedCardsData?.cards && savedCardsData.cards.length > 0 && !showCardForm ? (
                  <div className="space-y-3">
                    {savedCardsData.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSavedCardId(card.id);
                          setValue("savedCardId", card.id, { shouldValidate: true });
                          setValue("cardNumber", "", { shouldValidate: true });
                          setValue("cardExpiry", "", { shouldValidate: true });
                          setValue("cardCvv", "", { shouldValidate: true });
                          setValue("cardholderName", "", { shouldValidate: true });
                          setShowCardForm(false);
                        }}
                        className={`rounded-xl border p-4 bg-white dark:bg-slate-900/60 cursor-pointer transition-micro ${
                          savedCardId === card.id
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CreditCard className={`h-5 w-5 mt-0.5 ${
                            savedCardId === card.id ? 'text-primary' : 'text-slate-600 dark:text-slate-300'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="capitalize">{card.brand}</span>
                              <span className="text-sm text-slate-500">•••• •••• •••• {card.last4Digits}</span>
                              {card.isDefault && (
                                <Badge variant="outline" className="text-xs">Implicit</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              Expiră {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                              {card.cardholderName && ` • ${card.cardholderName}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCardForm(true);
                        setSavedCardId(null);
                        setValue("savedCardId", undefined, { shouldValidate: true });
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-micro text-left"
                    >
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-300 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            Adaugă un card nou
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Visa / Mastercard
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : !showCardForm ? (
                  <button
                    type="button"
                      onClick={() => {
                        setShowCardForm(true);
                        setSavedCardId(null);
                        setValue("savedCardId", undefined, { shouldValidate: true });
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-micro text-left"
                    >
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-300 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          Card bancar
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Visa / Mastercard</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          Plată securizată prin Netopia Payments
                        </p>
                      </div>
                    </div>
                  </button>
                ) : null}

                {/* Card Form */}
                {showCardForm && (
                  <div className="space-y-4 rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Detalii card bancar</h4>
                      {savedCardsData?.cards && savedCardsData.cards.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCardForm(false);
                            setSavedCardId(null);
                            setValue("cardNumber", "", { shouldValidate: true });
                            setValue("cardExpiry", "", { shouldValidate: true });
                            setValue("cardCvv", "", { shouldValidate: true });
                            setValue("cardholderName", "", { shouldValidate: true });
                            setValue("saveCard", "no-save");
                            setValue("savedCardId", undefined, { shouldValidate: true });
                          }}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          Anulează
                        </button>
                      )}
                    </div>

                    <Field label="Număr card *" error={errors.cardNumber?.message as string}>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...register("cardNumber", {
                          validate: (value) => {
                            // Only validate if user has started typing (value exists)
                            if (!value || value.trim().length === 0) {
                              // Check if savedCardId is set - if yes, this field is not required
                              const currentSavedCardId = watch("savedCardId");
                              if (currentSavedCardId) return true;
                              // If no saved card and user hasn't typed anything, don't show error yet
                              return undefined; // Let refine handle the general error
                            }
                            // If user typed something, validate format
                            const cleaned = value.replace(/\s/g, '');
                            if (cleaned.length < 13) {
                              return "Numărul cardului trebuie să aibă minim 13 cifre";
                            }
                            return true;
                          }
                        })}
                        maxLength={19}
                        onChange={(e) => {
                          // Format card number with spaces
                          let value = e.target.value.replace(/\s/g, '');
                          value = value.replace(/(.{4})/g, '$1 ').trim();
                          if (value.length <= 19) {
                            setValue("cardNumber", value, { shouldValidate: true });
                          }
                        }}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Data expirării *" error={errors.cardExpiry?.message as string}>
                        <Input
                          placeholder="MM/YY"
                          {...register("cardExpiry", {
                            validate: (value) => {
                              // Only validate if user has started typing
                              if (!value || value.trim().length === 0) {
                                const currentSavedCardId = watch("savedCardId");
                                if (currentSavedCardId) return true;
                                return undefined; // Let refine handle
                              }
                              // Validate format if user typed something
                              if (!/^\d{2}\/\d{2}$/.test(value)) {
                                return "Format invalid. Folosește MM/YY";
                              }
                              const [month, year] = value.split('/').map(Number);
                              if (month < 1 || month > 12) {
                                return "Luna trebuie să fie între 01 și 12";
                              }
                              return true;
                            }
                          })}
                          maxLength={5}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            if (value.length <= 5) {
                              setValue("cardExpiry", value, { shouldValidate: true });
                            }
                          }}
                        />
                      </Field>

                      <Field label="CVV *" error={errors.cardCvv?.message as string}>
                        <Input
                          placeholder="123"
                          type="password"
                          {...register("cardCvv", {
                            validate: (value) => {
                              // Only validate if user has started typing
                              if (!value || value.trim().length === 0) {
                                const currentSavedCardId = watch("savedCardId");
                                if (currentSavedCardId) return true;
                                return undefined; // Let refine handle
                              }
                              // Validate if user typed something
                              if (value.length < 3) {
                                return "CVV-ul trebuie să aibă minim 3 cifre";
                              }
                              return true;
                            }
                          })}
                          maxLength={4}
                        />
                      </Field>
                    </div>

                    <Field label="Nume titular card *" error={errors.cardholderName?.message as string}>
                      <Input
                        placeholder="Ion Popescu"
                        {...register("cardholderName", {
                          validate: (value) => {
                            // Only validate if user has started typing
                            if (!value || value.trim().length === 0) {
                              const currentSavedCardId = watch("savedCardId");
                              if (currentSavedCardId) return true;
                              return undefined; // Let refine handle
                            }
                            // Validate if user typed something
                            if (value.length < 2) {
                              return "Numele titularului trebuie să aibă minim 2 caractere";
                            }
                            return true;
                          }
                        })}
                      />
                    </Field>

                    {/* Save Card Radio Buttons */}
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="saveCard"
                          value="save"
                          checked={watch("saveCard") === "save"}
                          onChange={(e) => setValue("saveCard", e.target.value as "save" | "no-save")}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Salvează card</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="saveCard"
                          value="no-save"
                          checked={watch("saveCard") === "no-save" || !watch("saveCard")}
                          onChange={(e) => setValue("saveCard", e.target.value as "save" | "no-save")}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Nu salva card</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Error message if card is not properly filled - only show if user tried to submit or has started filling */}
                {errors.cardNumber && typeof errors.cardNumber.message === 'string' && errors.cardNumber.message.includes('Completează toate câmpurile') && (
                  (watch("cardNumber") || watch("cardExpiry") || watch("cardCvv") || watch("cardholderName") || !savedCardId) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        ⚠️ Completează toate câmpurile cardului bancar sau selectează un card salvat pentru a continua.
                      </p>
                    </div>
                  )
                )}

                <div className="space-y-4">
                  <label htmlFor="accept-terms" className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      checked={watch("acceptTerms")}
                      onChange={(e) => form.setValue("acceptTerms", e.target.checked, { shouldValidate: true })}
                      className="mt-1 h-5 w-5 cursor-pointer accent-primary rounded border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
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

                  <label htmlFor="accept-marketing" className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="accept-marketing"
                      checked={watch("acceptMarketing")}
                      onChange={(e) => form.setValue("acceptMarketing", e.target.checked)}
                      className="mt-1 h-5 w-5 cursor-pointer accent-primary rounded border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <div className="text-sm">
                      <p>Vreau să primesc oferte și promoții prin email</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4" />
                <span>Plată securizată</span>
              </div>
              <Button type="submit" disabled={isSubmitting || cartLoading || !!cartError || !cart || cart.items.length === 0} size="lg">
                {isSubmitting ? "Se procesează..." : "Plasează comanda"}
              </Button>
            </div>
          </div>
        </form>
      </RHFProvider>
    </main>
  );
}
