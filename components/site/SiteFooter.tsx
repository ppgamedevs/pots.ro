"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

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
                
                {/* Netopia Logo */}
                <div className="flex items-center justify-center h-8 bg-white border border-line rounded-md shadow-sm px-2">
                  <a 
                    href="https://netopia-payments.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center h-full px-2"
                    aria-label="Plăți securizate prin Netopia Payments"
                  >
                    <Image
                      src="/partners/payments/netopia.svg"
                      alt="Netopia Payments"
                      width={90}
                      height={24}
                      className="object-contain h-5"
                      priority={false}
                    />
                  </a>
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
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-sm text-ink/70">
              © 2025 FloristMarket.ro • OnlyTips SRL • CUI: CIF43414871 • J40/16778/2020 • 
              <Link href="/termeni" className="hover:text-ink transition-micro ml-1">
                Termeni și condiții
              </Link>
              {" • "}
              <Link href="/confidentialitate" className="hover:text-ink transition-micro">
                Politica de confidențialitate
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-sm text-ink/70 hover:text-ink transition-micro">
                  ANPC
                </a>
                <Link href="/sol" className="text-sm text-ink/70 hover:text-ink transition-micro">
                  SOL
                </Link>
              </div>
              <div className="text-xs text-ink/60">
                Conform O.U.G. nr. 34/2014, informăm că pentru soluționarea alternativă a litigiilor, consumatorii pot apela la{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-micro underline">
                  platforma SOL
                </a>
                {" "}sau la{" "}
                <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-micro underline">
                  ANPC
                </a>
                .
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink/70">Social:</span>
                <Link href="#" className="text-sm text-ink/70 hover:text-ink transition-micro">
                  Facebook
                </Link>
                <Link href="#" className="text-sm text-ink/70 hover:text-ink transition-micro">
                  Instagram
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
