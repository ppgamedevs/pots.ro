import "./globals.css";
import { Inter_Tight, Merriweather } from "next/font/google";
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

const interTight = Inter_Tight({ 
  subsets: ["latin-ext"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap" 
});

const merriweather = Merriweather({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: "swap", 
  variable: "--font-merriweather" 
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Marketplace-ul profesioniștilor din floristică`,
    template: `%s | ${SITE_NAME}`
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "FloristMarket.ro" }],
  creator: "FloristMarket.ro",
  publisher: "FloristMarket.ro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Marketplace-ul profesioniștilor din floristică`,
    description: "Totul pentru florăria ta: cutii din catifea, ghivece ceramice, panglici și accesorii florale, direct de la producători români.",
    images: [
      {
        url: OG_IMAGE_DEFAULT,
        width: 1200,
        height: 630,
        alt: "FloristMarket – Marketplace de accesorii florale premium",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Marketplace-ul profesioniștilor din floristică`,
    description: "Conectăm florăriile din România cu furnizorii de accesorii și ambalaje florale premium.",
    images: [OG_IMAGE_DEFAULT],
    creator: TWITTER_HANDLE,
    site: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "E-commerce",
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
        { label: "Cariere", href: "/cariere" },
        { label: "Contact", href: "/contact" },
        { label: "Presă", href: "/presa" }
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
        { label: "Termeni și condiții", href: "/termeni" },
        { label: "Politica de confidențialitate", href: "/confidentialitate" },
        { label: "Cookie-uri", href: "/cookies" },
        { label: "GDPR", href: "/gdpr" }
      ]
    },
    {
      title: "Utile",
      links: [
        { label: "Devino vânzător", href: "/seller" },
        { label: "Blog", href: "/blog" },
        { label: "Ghiduri", href: "/ghiduri" },
        { label: "Parteneri", href: "/parteneri" }
      ]
    }
  ];

  const payments = ["Visa", "Mastercard"];
  const carriers = ["Cargus"];

  return (
    <html lang="ro" className={`${interTight.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PMLWCKXG');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-EEMSRXZBG7"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EEMSRXZBG7');
            `,
          }}
        />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="font-sans antialiased text-[#1A1A1A] bg-[#FAFAF8] min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PMLWCKXG"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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