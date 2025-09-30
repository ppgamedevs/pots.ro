import { Metadata } from "next";
import { unstable_cache } from "next/cache";

// Mock products data (same as in page.tsx)
const products = {
  "1-ghiveci-ceramic-alb": {
    id: 1,
    title: "Ghiveci ceramic alb",
    price: 49.9,
    originalPrice: 69.9,
    currency: "RON",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center", 
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center",
    ],
    description: "Ghiveci ceramic alb de calitate superioară, perfect pentru plante de interior. Design modern și elegant care se potrivește în orice decor. Materialul ceramic oferă izolație termică excelentă și menține umiditatea optimă pentru rădăcini.",
    seller: {
      slug: "atelier-ceramic",
      name: "Atelier Ceramic",
      rating: 4.8,
      reviews: 127,
      location: "București",
      verified: true,
      description: "Specializați în ceramică artizanală de calitate superioară. Peste 10 ani de experiență în crearea de ghivece unice și durabile."
    },
    rating: 4.7,
    reviews: 89,
    inStock: true,
    stock: 15,
    category: "ghivece",
    tags: ["ceramic", "alb", "interior", "modern"]
  },
  "2-cutie-inalta-nevopsita": {
    id: 2,
    title: "Cutie înaltă natur",
    price: 79.0,
    currency: "RON",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center",
    ],
    description: "Cutie înaltă din carton natural, perfectă pentru aranjamente florale elegante. Design clasic care se potrivește perfect pentru evenimente speciale.",
    seller: {
      slug: "cardboard-street",
      name: "Cardboard Street",
      rating: 4.5,
      reviews: 34,
      location: "Cluj-Napoca",
      verified: true,
      description: "Specializați în cutii din carton natural pentru aranjamente florale."
    },
    rating: 4.5,
    reviews: 34,
    inStock: true,
    stock: 8,
    category: "cutii",
    tags: ["carton", "natur", "eco", "cadou"]
  }
};

// Cached function for product data
const getCachedProductData = unstable_cache(
  async (productId: string) => {
    const product = products[productId as keyof typeof products];
    return product;
  },
  ['product-data'],
  {
    tags: ['products'],
    revalidate: false, // On-demand revalidation
  }
);

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id, slug } = await params;
  const productId = `${id}-${slug}`;
  const product = await getCachedProductData(productId);

  if (!product) {
    return {
      title: "Produs nu găsit | Pots.ro",
      description: "Produsul căutat nu a fost găsit pe Pots.ro",
    };
  }

  const title = `${product.title} - ${product.price.toFixed(2)} RON | Pots.ro`;
  const description = `${product.description} Cumpără ${product.title} de la ${product.seller.name} cu doar ${product.price.toFixed(2)} RON. Livrare rapidă în toată România.`;

  return {
    title,
    description,
    keywords: [
      product.title,
      "ghiveci ceramic",
      "plante de interior",
      "floristică",
      "pots.ro",
      product.seller.name,
      "ceramic alb",
      "ghiveci plante"
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://pots.ro/p/${id}-${slug}`,
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
      siteName: "Pots.ro",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.images[0]],
    },
    alternates: {
      canonical: `https://pots.ro/p/${id}-${slug}`,
    },
  };
}

// ISR Configuration for products
export const revalidate = false; // On-demand revalidation

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}