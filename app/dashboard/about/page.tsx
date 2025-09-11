"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import MarkdownEditor from "@/components/seller/MarkdownEditor";

// Mock data for seller about page
const mockAboutData = {
  content: `# Despre Atelier Ceramic

Bun venit la **Atelier Ceramic** - unul dintre partenerii noștri verificați de pe platforma Pots.ro, specializat în produse de calitate pentru floristică.

## Experiența noastră

Cu peste 5 ani de experiență în domeniu, ne-am specializat în:

- **Ghivece ceramice** - pentru plante de interior și exterior
- **Cutii decorative** - pentru aranjamente florale
- **Accesorii florale** - panglici, materiale decorative

## Calitatea produselor

Toate produsele noastre sunt:

- ✅ Testate pentru durabilitate
- ✅ Sigurante pentru plante
- ✅ Realizate din materiale de calitate
- ✅ Verificate înainte de livrare

## Contact

Pentru întrebări despre produse, vă rugăm să folosiți [mesageria platformei](https://pots.ro/contact) sau să ne contactați prin [email](mailto:contact@pots.ro).

## Links externe

- [Ghidul nostru de îngrijire a plantelor](https://example.com/plant-care)
- [Inspirații pentru aranjamente](https://example.com/floral-arrangements)
- [Blogul nostru](https://example.com/blog)

---

*Toate produsele sunt vândute prin Pots Marketplace. Asistența, returul și garanția sunt gestionate de Pots.*`,
  seoTitle: "Despre Atelier Ceramic - Partener Pots.ro",
  seoDescription: "Descoperă Atelier Ceramic, partener verificat pe Pots.ro. Specializați în ghivece ceramice, cutii decorative și accesorii florale de calitate."
};

export default function AboutPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [aboutData, setAboutData] = useState(mockAboutData);

  useEffect(() => {
    // Fetch about data from API
    const fetchAboutData = async () => {
      try {
        const response = await fetch('/api/seller/about');
        if (response.ok) {
          const data = await response.json();
          setAboutData(data);
        }
        setInitialLoading(false);
      } catch (error) {
        toast({
          title: "Eroare",
          description: "Nu s-a putut încărca datele paginii About.",
          variant: "destructive",
        });
        setInitialLoading(false);
      }
    };

    fetchAboutData();
  }, [toast]);

  const handleSave = async (data: { content: string; seoTitle: string; seoDescription: string }) => {
    setLoading(true);
    try {
      // Save about data via API
      const response = await fetch('/api/seller/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save about data');
      }

      const savedData = await response.json();
      setAboutData(savedData);
      
      toast({
        title: "Succes",
        description: "Pagina About a fost salvată cu succes.",
      });

      // Trigger ISR revalidation for the seller page
      await fetch('/api/revalidate?path=/s/partner-a1b2', { method: 'POST' });
      
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva pagina About.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Editează pagina About
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Personalizează pagina despre tine care apare pe mini-site-ul tău
        </p>
      </div>

      <MarkdownEditor
        initialContent={aboutData.content}
        initialSeoTitle={aboutData.seoTitle}
        initialSeoDescription={aboutData.seoDescription}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
