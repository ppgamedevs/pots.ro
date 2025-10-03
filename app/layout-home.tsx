import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pots.ro - Marketplace românesc pentru floristică",
  description: "Descoperă o gamă largă de ghivece, cutii și accesorii pentru floristică. Calitate superioară, prețuri competitive, livrare rapidă în toată România.",
  keywords: [
    "ghivece",
    "cutii",
    "accesorii florale",
    "floristică",
    "floristmarket.ro",
    "plante de interior",
    "aranjamente florale",
    "ceramic",
    "carton",
    "panglici"
  ],
  openGraph: {
    title: "Pots.ro - Marketplace românesc pentru floristică",
    description: "Descoperă o gamă largă de ghivece, cutii și accesorii pentru floristică. Calitate superioară, prețuri competitive, livrare rapidă în toată România.",
    type: "website",
    url: "https://floristmarket.ro",
    siteName: "Pots.ro",
    images: [
      {
        url: "/placeholder.svg",
        width: 1200,
        height: 630,
        alt: "Pots.ro - Marketplace românesc pentru floristică",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pots.ro - Marketplace românesc pentru floristică",
    description: "Descoperă o gamă largă de ghivece, cutii și accesorii pentru floristică. Calitate superioară, prețuri competitive, livrare rapidă în toată România.",
    images: ["/placeholder.svg"],
  },
  alternates: {
    canonical: "https://floristmarket.ro",
  },
};
