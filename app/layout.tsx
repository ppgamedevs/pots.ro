import "./globals.css";
import { Inter_Tight, Merriweather } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/ui/use-confirm";
import { Toaster } from "@/components/ui/toast";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { CommandPalette } from "@/components/search/command-palette";
import { CookieConsent } from "@/components/cookie-consent";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/error-boundary";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import CookieBanner from "@/components/common/CookieBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SupportThreadChatProvider } from "@/lib/support-thread-chat-context";
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
    default: `${SITE_NAME} - Marketplace-ul profesioniștilor din floristică`,
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
    title: `${SITE_NAME} - Marketplace-ul profesioniștilor din floristică`,
    description: "Totul pentru florăria ta: cutii din catifea, ghivece ceramice, panglici și accesorii florale, direct de la producători români.",
    images: [
      {
        url: OG_IMAGE_DEFAULT,
        width: 1200,
        height: 630,
        alt: "FloristMarket - Marketplace de accesorii florale premium",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Marketplace-ul profesioniștilor din floristică`,
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
      <body className="font-sans antialiased text-[#1A1A1A] bg-[#FAFAF8] min-h-screen">
        {/* Google Tag Manager */}
        <Script
          id="gtm-init"
          strategy="afterInteractive"
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
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EEMSRXZBG7"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EEMSRXZBG7');
            `,
          }}
        />
        
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PMLWCKXG"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        
        {/* Block repeated icon requests from browser extensions */}
        <Script
          id="block-icon-requests"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                const blockedPaths = ['/32.png', '/64.png', '/128.png', '/192.png', '/512.png', '/icon.png', '/icon'];
                const originalFetch = window.fetch;
                let requestCount = {};
                
                window.fetch = function(...args) {
                  const url = args[0];
                  const urlString = typeof url === 'string' ? url : url.toString();
                  
                  // Check if this is a blocked icon request
                  const blockedPath = blockedPaths.find(path => urlString.includes(path));
                  if (blockedPath) {
                    requestCount[blockedPath] = (requestCount[blockedPath] || 0) + 1;
                    // Only log first few requests to avoid spam
                    if (requestCount[blockedPath] <= 3) {
                      console.warn('Blocked icon request from extension:', blockedPath);
                    }
                    // Return a rejected promise to stop the request
                    return Promise.reject(new Error('Icon file not found'));
                  }
                  
                  return originalFetch.apply(this, args);
                };
              })();
            `,
          }}
        />
        
        {/* Fetch Monitor Script - Development Only - Temporarily disabled due to syntax error */}
        {/* {process.env.NODE_ENV !== 'production' && (
          <Script
            id="fetch-monitor"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (typeof window === 'undefined') return;
                  if (window.__FETCH_MONITOR_INITIALIZED__) return;
                  window.__FETCH_MONITOR_INITIALIZED__ = true;
                  const originalFetch = window.fetch;
                  const logs = [];
                  const maxLogs = 100;
                  const activeRequests = new Map();
                  window.fetch = function(...args) {
                    const [url, options] = args;
                    const urlString = typeof url === 'string' ? url : url.toString();
                    const method = options?.method || 'GET';
                    if (urlString.startsWith('chrome-extension://') || urlString.startsWith('moz-extension://') || urlString.startsWith('safari-extension://')) {
                      return originalFetch.apply(this, args);
                    }
                    const startTime = Date.now();
                    const requestKey = method + ':' + urlString;
                    const logEntry = { url: urlString, method: method, timestamp: startTime, time: new Date().toISOString() };
                    activeRequests.set(requestKey, startTime);
                    return originalFetch.apply(this, args).then(response => {
                      logEntry.duration = Date.now() - startTime;
                      logEntry.status = response.status;
                      activeRequests.delete(requestKey);
                      logs.push(logEntry);
                      if (logs.length > maxLogs) logs.shift();
                      const now = Date.now();
                      const recentLogs = logs.filter(log => now - log.timestamp < 5000);
                      const urlCounts = {};
                      recentLogs.forEach(log => { urlCounts[log.url] = (urlCounts[log.url] || 0) + 1; });
                      Object.keys(urlCounts).forEach(url => {
                        if (urlCounts[url] > 5) {
                          console.warn('Continuous fetch detected:', url, 'called', urlCounts[url], 'times in last 5 seconds');
                        }
                      });
                      return response;
                    }).catch(error => {
                      logEntry.duration = Date.now() - startTime;
                      logEntry.error = error.message;
                      activeRequests.delete(requestKey);
                      logs.push(logEntry);
                      throw error;
                    });
                  };
                  setInterval(() => {
                    const now = Date.now();
                    const recentLogs = logs.filter(log => now - log.timestamp < 10000);
                    if (recentLogs.length === 0) return;
                    const urlStats = {};
                    recentLogs.forEach(log => {
                      if (!urlStats[log.url]) {
                        urlStats[log.url] = { count: 0, totalDuration: 0, methods: new Set() };
                      }
                      urlStats[log.url].count++;
                      if (log.duration) urlStats[log.url].totalDuration += log.duration;
                      urlStats[log.url].methods.add(log.method);
                    });
                    console.group('Fetch Summary (last 10 seconds)');
                    Object.keys(urlStats).forEach(url => {
                      const stats = urlStats[url];
                      const avgDuration = stats.totalDuration ? (stats.totalDuration / stats.count).toFixed(0) : 'N/A';
                      const methods = Array.from(stats.methods).join(', ');
                      console.log(url + ' - ' + stats.count + ' calls (' + methods + ') - avg ' + avgDuration + 'ms');
                    });
                    console.groupEnd();
                  }, 10000);
                  console.log('Fetch monitoring enabled');
                })();
              `,
            }}
          />
        )} */}
        
        <ThemeProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              <SupportThreadChatProvider>
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
              </SupportThreadChatProvider>
            </ErrorBoundary>
            <Toaster />
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