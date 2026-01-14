"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Button } from "../ui/button";
import dynamic from "next/dynamic";

// Import Netopia Logo component dynamically to avoid SSR issues
// Componenta trebuie să fie client-side only pentru că folosește DOM APIs
const NTPIdentity = dynamic(
  () => import('ntp-logo-react'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-20 h-8 bg-white border border-line rounded-md">
        <span className="text-xs text-ink/50">Loading...</span>
      </div>
    )
  }
);

// ID-ul punctului de vânzare pentru logo Netopia
// Obține-l din panoul Netopia -> Identitate vizuală -> copiază codul generat
// ID-ul se găsește în parametrul ?p=XXXXX din URL-ul script-ului
const NETOPIA_POS_ID = process.env.NEXT_PUBLIC_NETOPIA_POS_ID || '156304';

export interface FooterColumn {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}

export interface SiteFooterProps {
  columns: FooterColumn[];
  payments: string[];
  carriers: string[];
}

export function SiteFooter({ columns, payments, carriers }: SiteFooterProps) {
  return (
    <footer className="bg-bg-soft border-t border-line">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {columns.map((column, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-ink">{column.title}</h3>
              <div className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <Link
                    key={linkIndex}
                    href={link.href}
                    className="block text-sm text-muted hover:text-ink transition-micro"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="border-t border-line pt-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ink">Metode de plată:</span>
              <div className="flex items-center gap-3">
                {/* Visa */}
                <div className="flex items-center justify-center w-12 h-8 bg-white border border-line rounded-md shadow-sm p-1">
                  <Image
                    src="/partners/payments/visa.svg"
                    alt="Visa"
                    width={32}
                    height={20}
                    className="object-contain"
                  />
                </div>
                
                {/* Mastercard */}
                <div className="flex items-center justify-center w-12 h-8 bg-white border border-line rounded-md shadow-sm p-1">
                  <Image
                    src="/partners/payments/mastercard.svg"
                    alt="Mastercard"
                    width={32}
                    height={20}
                    className="object-contain"
                  />
                </div>
                
                {/* Netopia Logo - React Component */}
                {/* 
                  IMPORTANT: Folosim componenta React oficială de la Netopia
                  secret="156304" este ID-ul punctului de vânzare (POS ID)
                  Obține-l din panoul Netopia -> Identitate vizuală
                  version="orizontal" = horizontal, "vertical" = vertical
                */}
                <div className="flex items-center justify-center h-8 bg-white border border-line rounded-md shadow-sm px-2 min-w-[100px]">
                  <NTPIdentity 
                    color="#ffffff" 
                    version="orizontal" 
                    secret={NETOPIA_POS_ID}
                  />
                </div>
              </div>
            </div>

            {/* Carriers */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ink">Curieri:</span>
              <div className="flex items-center gap-2">
                {carriers.map((carrier, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-white border border-line rounded-md text-xs font-medium text-ink shadow-sm"
                  >
                    {carrier}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-line pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold text-ink mb-2">
              Abonează-te la newsletter
            </h3>
            <p className="text-sm text-ink/70 mb-4">
              Primește oferte exclusive și noutăți despre produse
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Adresa ta de email"
                className="flex-1 px-3 py-2 border border-line rounded-lg bg-white text-ink placeholder:text-ink/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-micro"
              />
              <Button 
                size="sm" 
                className="bg-primary text-white hover:bg-primary/90 transition-micro font-medium"
              >
                Abonează-te
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-line pt-8">
          <div className="flex flex-col gap-6">
            {/* Copyright and Legal Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-ink/70">
              <span>© 2025 FloristMarket.ro</span>
              <span className="hidden sm:inline">•</span>
              <span>OnlyTips SRL</span>
              <span className="hidden sm:inline">•</span>
              <span>CUI: CIF43414871</span>
              <span className="hidden sm:inline">•</span>
              <span>J40/16778/2020</span>
              <span className="hidden sm:inline">•</span>
              <Link href="/termeni" className="hover:text-ink transition-micro">
                Termeni și condiții
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link href="/confidentialitate" className="hover:text-ink transition-micro">
                Politica de confidențialitate
              </Link>
            </div>

            {/* ANPC, SOL, and Social Media */}
            <div className="flex flex-col items-center gap-6">
              {/* ANPC and SOL Logos */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a 
                  href="https://anpc.ro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 px-4 bg-white border border-line rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
                  aria-label="ANPC - Autoritatea Națională pentru Protecția Consumatorilor"
                >
                  <Image
                    src="/partners/anpc.svg"
                    alt="ANPC"
                    width={80}
                    height={30}
                    className="object-contain"
                  />
                </a>
                
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 px-4 bg-white border border-line rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
                  aria-label="SOL - Platforma Online pentru Soluționarea Litigiilor"
                >
                  <Image
                    src="/partners/sol.svg"
                    alt="SOL"
                    width={60}
                    height={30}
                    className="object-contain"
                  />
                </a>
              </div>

              {/* Legal Notice */}
              <p className="text-xs text-ink/60 text-center max-w-2xl">
                Conform O.U.G. nr. 34/2014, informăm că pentru soluționarea alternativă a litigiilor, consumatorii pot apela la{" "}
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline font-medium"
                >
                  platforma SOL
                </a>
                {" "}sau la{" "}
                <a 
                  href="https://anpc.ro" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline font-medium"
                >
                  ANPC
                </a>
                .
              </p>

              {/* Social Media */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink/70">Social:</span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-white border border-line rounded-lg shadow-sm hover:shadow-md hover:bg-primary/5 transition-all hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Image
                      src="/partners/facebook.svg"
                      alt="Facebook"
                      width={20}
                      height={20}
                      className="object-contain text-ink/70"
                    />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-white border border-line rounded-lg shadow-sm hover:shadow-md hover:bg-primary/5 transition-all hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Image
                      src="/partners/instagram.svg"
                      alt="Instagram"
                      width={20}
                      height={20}
                      className="object-contain text-ink/70"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
