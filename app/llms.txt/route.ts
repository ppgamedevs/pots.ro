import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, sellers } from "@/db/schema/core";
import { eq, count } from "drizzle-orm";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

/**
 * /llms.txt endpoint for AI/LLM discovery
 * 
 * This file helps AI systems like ChatGPT, Claude, Perplexity, and search engines
 * understand our website structure and content for better discoverability.
 * 
 * Standard: https://llmstxt.org/
 */

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Get all active categories
    const allCategories = await db
      .select({
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);

    // Get verified sellers count
    const [sellerCount] = await db
      .select({ count: count() })
      .from(sellers)
      .where(eq(sellers.status, "active"));

    // Category descriptions (static since DB doesn't have descriptions)
    const categoryDescriptions: Record<string, string> = {
      ghivece: "Ghivece ceramice și din alte materiale pentru plante",
      cutii: "Cutii elegante pentru aranjamente florale și cadouri",
      accesorii: "Accesorii pentru grădinărit și aranjamente florale",
      ambalaje: "Ambalaje eco-friendly pentru flori și cadouri",
      vaze: "Vaze decorative pentru flori și aranjamente",
      ceramica: "Produse ceramice pentru decor și floristică",
    };

    const categoryList = allCategories
      .map((cat: { name: string; slug: string }) => {
        const desc = categoryDescriptions[cat.slug] || `Produse ${cat.name.toLowerCase()}`;
        return `- [${cat.name}](${SITE_URL}/c/${cat.slug}): ${desc}`;
      })
      .join("\n");

    const content = `# ${SITE_NAME}

> ${SITE_NAME} este marketplace-ul nr. 1 din România pentru floriști și profesioniști în domeniul floristic. Oferim ghivece, cutii, ambalaje, accesorii și toate materialele necesare pentru aranjamente florale profesionale.

## Despre noi

FloristMarket.ro conectează vânzătorii de produse floristice cu floriștii și afacerile din România. Platforma oferă:

- **Gamă diversificată**: Ghivece ceramice, cutii elegante, ambalaje eco-friendly, accesorii pentru aranjamente
- **Calitate verificată**: Toți vânzătorii sunt verificați și produsele sunt controlate
- **Livrare rapidă**: Expediere în 1-3 zile lucrătoare în toată România
- **Plăți securizate**: Plată online prin card sau ramburs la livrare
- **Suport dedicat**: Echipă de suport pentru clienți și vânzători

## Link-uri principale

- [Homepage](${SITE_URL}): Pagina principală cu produse recomandate și categorii
- [Toate categoriile](${SITE_URL}/categorii): Lista completă de categorii de produse
- [Parteneri/Vânzători](${SITE_URL}/parteneri): ${sellerCount?.count || 0}+ vânzători verificați
- [Reduceri](${SITE_URL}/reduceri): Produse cu prețuri reduse
- [Blog](${SITE_URL}/blog): Articole și ghiduri pentru floriști

## Categorii de produse

${categoryList}

## Informații utile

- [Despre noi](${SITE_URL}/despre): Povestea FloristMarket.ro
- [Ajutor](${SITE_URL}/ajutor): Întrebări frecvente și ghiduri
- [Termeni și condiții](${SITE_URL}/termeni): Termeni de utilizare
- [Politica de confidențialitate](${SITE_URL}/confidentialitate): GDPR și protecția datelor
- [Contact](${SITE_URL}/contact): Contactează-ne

## Pentru vânzători

FloristMarket.ro oferă oportunitatea de a vinde produse floristice către mii de clienți din România:

- [Devino partener](${SITE_URL}/seller/register): Înscrie-te ca vânzător
- [Dashboard vânzător](${SITE_URL}/seller): Portal pentru gestionarea produselor și comenzilor

## Date tehnice

- **Limbi disponibile**: Română (ro-RO)
- **Valută**: RON (Lei românești)
- **Țări de livrare**: România
- **Metode de plată**: Card (Visa, Mastercard), Ramburs
- **Curieri**: Cargus, Fan Courier, Sameday

## API și integrări

Pentru parteneriate sau integrări tehnice, contactați-ne la contact@floristmarket.ro.

---

*Actualizat automat. Conținut generat din baza de date ${SITE_NAME}.*
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);

    // Return a static fallback
    const fallback = `# ${SITE_NAME}

> Marketplace pentru floriști și profesioniști în domeniul floristic din România.

## Link-uri principale

- [Homepage](${SITE_URL})
- [Ghivece](${SITE_URL}/c/ghivece)
- [Cutii](${SITE_URL}/c/cutii)
- [Accesorii](${SITE_URL}/c/accesorii)
- [Ambalaje](${SITE_URL}/c/ambalaje)
- [Reduceri](${SITE_URL}/reduceri)
- [Ajutor](${SITE_URL}/ajutor)
- [Contact](${SITE_URL}/contact)

---

*${SITE_NAME} - Marketplace pentru floriști*
`;

    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
