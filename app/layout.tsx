import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/ui/use-confirm";
import { Toaster } from "@/components/ui/toast";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { Toaster as SonnerToaster } from "sonner";
import { CommandPalette } from "@/components/search/command-palette";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  title: "Pots.ro",
  description: "Marketplace românesc pentru produse de floristică",
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
                 </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
