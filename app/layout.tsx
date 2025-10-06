import "./globals.css";
import { Inter, Inter_Display, Merriweather } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/ui/use-confirm";
import { Toaster } from "@/components/ui/toast";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { Toaster as SonnerToaster } from "sonner";
import { CommandPalette } from "@/components/search/command-palette";
import { CookieConsent } from "@/components/cookie-consent";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/error-boundary";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import CookieBanner from "@/components/common/CookieBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS, TWITTER_HANDLE, OG_IMAGE_DEFAULT } from "@/lib/constants";
// import { PerformanceOptimizer, criticalCSS, criticalResources } from "@/components/ui/performance-optimizer";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const interDisplay = Inter_Display({ subsets: ["latin"], display: "swap", variable: "--font-inter-display" });
const merriweather = Merriweather({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  display: "swap", 
  variable: "--font-merriweather" 
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Marketplace de Floristică`,
    template: `%s | ${SITE_NAME}`
  },
  icons: {
    icon: '/favicon.svg',
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Marketplace de Floristică`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_DEFAULT,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – Marketplace de Floristică`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Marketplace de Floristică`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_DEFAULT],
    creator: TWITTER_HANDLE,
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
  // Mock data for header and footer
  const categories = [
    { id: "ghivece", name: "Ghivece", href: "/c/ghivece" },
    { id: "cutii", name: "Cutii", href: "/c/cutii" },
    { id: "ambalaje", name: "Ambalaje", href: "/c/ambalaje" },
  ];

  const footerColumns = [
    {
      title: "Companie",
      links: [
        { label: "Despre noi", href: "/about" },
        { label: "Cariere", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Presă", href: "/press" }
      ]
    },
    {
      title: "Help Center",
      links: [
        { label: "Caută ajutor", href: "/help" },
        { label: "Comenzi", href: "/help/comenzi" },
        { label: "Livrare", href: "/help/livrare" },
        { label: "Retururi", href: "/help/retururi" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Termeni și condiții", href: "/terms" },
        { label: "Politica de confidențialitate", href: "/privacy" },
        { label: "Cookie-uri", href: "/cookies" },
        { label: "GDPR", href: "/gdpr" }
      ]
    },
    {
      title: "Utile",
      links: [
        { label: "Devino vânzător", href: "/seller" },
        { label: "Blog", href: "/blog" },
        { label: "Ghiduri", href: "/guides" },
        { label: "Parteneri", href: "/partners" }
      ]
    }
  ];

  const payments = ["Visa", "Mastercard", "PayPal", "Revolut"];
  const carriers = ["Fan Courier", "DPD", "Cargus", "Sameday"];

  return (
    <html lang="ro" className={`${inter.variable} ${interDisplay.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              <header>
                <SiteHeader 
                  categories={categories}
                  suggestions={["ghivece ceramica", "cutii rotunde", "ambalaje hârtie"]}
                />
              </header>
              
              <main>
                {children}
              </main>
              
              <footer>
                <SiteFooter 
                  columns={footerColumns}
                  payments={payments}
                  carriers={carriers}
                />
              </footer>
              
              {/* Chat Widget */}
              <ChatWidget />
            </ErrorBoundary>
            <Toaster />
            <SonnerToaster richColors position="top-center" closeButton />
            <PerformanceMonitor />
            <CommandPalette />
            <CookieBanner />
            <SpeedInsights />
            <Analytics />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}