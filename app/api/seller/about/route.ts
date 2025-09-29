import { NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/http";

// Mock in-memory storage for seller about data
const sellerAboutData: Record<string, {
  content: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}> = {};

export async function GET() {
  // In a real app, this would fetch from database
  const sellerId = "partner-a1b2"; // This would come from auth/session
  
  const aboutData = sellerAboutData[sellerId] || {
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
    seoDescription: "Descoperă Atelier Ceramic, partener verificat pe Pots.ro. Specializați în ghivece ceramice, cutii decorative și accesorii florale de calitate.",
    updatedAt: new Date().toISOString()
  };

  return NextResponse.json(aboutData, { headers: { ...cacheHeaders } });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { content, seoTitle, seoDescription } = body;

    if (!content || !seoTitle || !seoDescription) {
      return NextResponse.json(
        { error: "content, seoTitle, and seoDescription are required" },
        { status: 400 }
      );
    }

    // In a real app, this would save to database
    const sellerId = "partner-a1b2"; // This would come from auth/session
    
    const aboutData = {
      content: content.trim(),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      updatedAt: new Date().toISOString()
    };

    sellerAboutData[sellerId] = aboutData;

    // In a real app, this would trigger ISR revalidation
    // await revalidateTag(`seller-${sellerId}`);
    // await revalidatePath(`/s/${sellerId}`);

    return NextResponse.json(aboutData, { headers: { ...cacheHeaders } });

  } catch (error) {
    console.error('About page update error:', error);
    return NextResponse.json(
      { error: "Failed to update about page" },
      { status: 500 }
    );
  }
}
