import "./globals.css";
import { Inter } from "next/font/google";
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
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS, TWITTER_HANDLE, OG_IMAGE_DEFAULT } from "@/lib/constants";
// import { PerformanceOptimizer, criticalCSS, criticalResources } from "@/components/ui/performance-optimizer";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

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
  return (
    <html lang="ro" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
            <SonnerToaster richColors position="top-center" closeButton />
            <PerformanceMonitor />
            <CommandPalette />
            <CookieConsent />
            <SpeedInsights />
            <Analytics />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}