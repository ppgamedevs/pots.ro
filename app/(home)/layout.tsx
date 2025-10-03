import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FloristMarket – Marketplace de floristică: flori, ambalaje, cutii, accesorii",
  description: "Descoperă cel mai mare marketplace de floristică din România. Ghivece, cutii, ambalaje și accesorii de calitate de la selleri verificați. Plăți securizate, retur 14 zile.",
  keywords: [
    "floristică",
    "ghivece",
    "cutii flori",
    "ambalaje",
    "accesorii florale",
    "marketplace",
    "România",
    "vânzător",
    "plante",
    "flori"
  ],
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://floristmarket.ro",
    siteName: "FloristMarket",
    title: "FloristMarket – Marketplace de floristică",
    description: "Descoperă cel mai mare marketplace de floristică din România. Ghivece, cutii, ambalaje și accesorii de calitate.",
    images: [
      {
        url: "https://floristmarket.ro/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FloristMarket – Marketplace de floristică",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FloristMarket – Marketplace de floristică",
    description: "Descoperă cel mai mare marketplace de floristică din România.",
    images: ["https://floristmarket.ro/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://floristmarket.ro",
  },
};
