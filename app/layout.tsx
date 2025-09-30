import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { CookieConsent } from "@/components/cookie-consent";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Pots.ro - E-commerce Platform",
    template: "%s | Pots.ro"
  },
  description: "A modern e-commerce platform built with Next.js 14, Vercel Postgres, Drizzle ORM, Lucia Auth, and Vercel Blob.",
  keywords: ["e-commerce", "pots", "marketplace", "nextjs", "vercel"],
  authors: [{ name: "Pots.ro Team" }],
  creator: "Pots.ro",
  publisher: "Pots.ro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Pots.ro - E-commerce Platform",
    description: "A modern e-commerce platform built with Next.js 14, Vercel Postgres, Drizzle ORM, Lucia Auth, and Vercel Blob.",
    siteName: "Pots.ro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pots.ro - E-commerce Platform",
    description: "A modern e-commerce platform built with Next.js 14, Vercel Postgres, Drizzle ORM, Lucia Auth, and Vercel Blob.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <CookieConsent />
          <PerformanceMonitor />
        </ThemeProvider>
      </body>
    </html>
  );
}