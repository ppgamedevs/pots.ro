import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/ui/use-confirm";
import { Toaster } from "@/components/ui/toast";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { Toaster as SonnerToaster } from "sonner";
import { CommandPalette } from "@/components/search/command-palette";
import { CookieConsent } from "@/components/cookie-consent";
// import { PerformanceOptimizer, criticalCSS, criticalResources } from "@/components/ui/performance-optimizer";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  metadataBase: new URL('https://pots.ro'),
  title: {
    default: "Pots.ro - Marketplace românesc pentru floristică",
    template: "%s | Pots.ro"
  },
  description: "Descoperă o gamă largă de ghivece, cutii și accesorii pentru floristică. Calitate superioară, prețuri competitive, livrare rapidă în toată România.",
  keywords: [
    "ghivece",
    "cutii", 
    "accesorii florale",
    "floristică",
    "pots.ro",
    "plante de interior",
    "aranjamente florale",
    "ceramic",
    "carton",
    "panglici"
  ],
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://pots.ro",
    siteName: "Pots.ro",
    title: "Pots.ro - Marketplace românesc pentru floristică",
    description: "Descoperă o gamă largă de ghivece, cutii și accesorii pentru floristică. Calitate superioară, prețuri competitive, livrare rapidă în toată România.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=630&fit=crop&crop=center",
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
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=630&fit=crop&crop=center"],
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ConfirmProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors position="top-center" closeButton />
            <PerformanceMonitor />
            <CommandPalette />
            <CookieConsent />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}