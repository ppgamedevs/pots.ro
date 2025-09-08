import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  title: "Pots.ro",
  description: "Marketplace românesc pentru produse de floristică",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
