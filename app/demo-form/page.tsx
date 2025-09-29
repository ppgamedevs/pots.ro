"use client";
import { z } from "zod";
import { RHFProvider, useZodForm, Field } from "@/components/ui/form-helpers";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/native-checkbox";
import { useState } from "react";
import { Modal } from "@/components/ui/animated-modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const schema = z.object({
  title: z.string().min(3, "Minim 3 caractere"),
  price: z.coerce.number().positive("Preț > 0"),
  category: z.string().min(1, "Alege categorie"),
  description: z.string().min(10, "Descriere prea scurtă"),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export default function DemoFormPage() {
  const form = useZodForm(schema, { 
    title: "", 
    price: 0, 
    category: "", 
    description: "",
    inStock: false,
    featured: false,
  });
  const { register, handleSubmit, formState: { errors }, watch } = form;
  const [open, setOpen] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    // simulăm salvarea
    await new Promise(r => setTimeout(r, 400));
    toast.success("Produs salvat cu succes!");
    setOpen(false);
  });

  const handlePreview = () => {
    const values = form.getValues();
    if (!values.title || !values.price || !values.category) {
      toast.error("Completează toate câmpurile obligatorii pentru previzualizare");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <RHFProvider methods={form}>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Creează produs</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Completează formularul pentru a adăuga un produs nou
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Titlu *" error={errors.title?.message as string}>
                    <Input placeholder="Ghiveci ceramic alb" {...register("title")} />
                  </Field>

                  <Field label="Preț (RON) *" error={errors.price?.message as string}>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="49.90" 
                      {...register("price")} 
                    />
                  </Field>
                </div>

                <Field label="Categorie *" error={errors.category?.message as string}>
                  <Select
                    {...register("category")}
                    options={[
                      { value: "", label: "Alege..." },
                      { value: "ghivece", label: "Ghivece" },
                      { value: "cutii", label: "Cutii" },
                      { value: "accesorii", label: "Accesorii" },
                    ]}
                  />
                </Field>

                <Field 
                  label="Descriere *" 
                  error={errors.description?.message as string} 
                  hint="Minim 10 caractere"
                >
                  <Textarea 
                    placeholder="Detalii despre produs..." 
                    {...register("description")} 
                  />
                </Field>

                <div className="flex gap-6">
                  <Checkbox
                    checked={watch("inStock")}
                    onChange={(checked) => form.setValue("inStock", checked)}
                    label="În stoc"
                  />
                  <Checkbox
                    checked={watch("featured")}
                    onChange={(checked) => form.setValue("featured", checked)}
                    label="Produs recomandat"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handlePreview}
                    className="flex-1"
                  >
                    Previzualizează
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    Salvează produs
                  </Button>
                </div>
              </form>
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => toast.info("Toast de test!")}
              >
                Testează Toast
              </Button>
            </div>
          </div>
        </RHFProvider>

        <Modal open={open} onOpenChange={setOpen} title="Previzualizare produs">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">Titlu:</span>
              <span className="text-slate-900 dark:text-slate-100">{form.getValues("title") || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">Preț:</span>
              <span className="text-slate-900 dark:text-slate-100">{form.getValues("price") || "—"} RON</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">Categorie:</span>
              <span className="text-slate-900 dark:text-slate-100">{form.getValues("category") || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">În stoc:</span>
              <span className="text-slate-900 dark:text-slate-100">{form.getValues("inStock") ? "Da" : "Nu"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">Recomandat:</span>
              <span className="text-slate-900 dark:text-slate-100">{form.getValues("featured") ? "Da" : "Nu"}</span>
            </div>
            <div className="pt-2">
              <span className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Descriere:</span>
              <p className="text-slate-900 dark:text-slate-100">{form.getValues("description") || "—"}</p>
            </div>
          </div>
        </Modal>
      </main>
      <Footer />
    </>
  );
}
