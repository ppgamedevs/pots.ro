import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube, Music2, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Companie</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/about" className="hover:text-brand transition-colors">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-brand transition-colors">
                  Cariere
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-brand transition-colors">
                  Presa
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Ajutor</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/ajutor" className="hover:text-brand transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-brand transition-colors">
                  Politica de retur
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-brand transition-colors">
                  Livrare & plăți
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Legal</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/termeni" className="hover:text-brand transition-colors">
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link href="/confidentialitate" className="hover:text-brand transition-colors">
                  Politica de confidențialitate
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-brand transition-colors">
                  Politica Cookies
                </Link>
              </li>
              <li>
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="nofollow noopener"
                  className="hover:text-brand transition-colors"
                >
                  ANPC – soluționare online
                </a>
              </li>
            </ul>
          </div>

          {/* Useful */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Utile</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/blog" className="hover:text-brand transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-brand transition-colors">
                  Parteneri
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-brand transition-colors">
                  Devino seller
                </Link>
              </li>
              <li>
                <Link href="/affiliates" className="hover:text-brand transition-colors">
                  Program de afiliere
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact box */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact info */}
            <div>
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Contact</h3>
              <div className="space-y-3 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-slate-400" />
                  <span>Str. Exemplu 123, București, România</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <a 
                    href="mailto:hello@floristmarket.ro" 
                    className="hover:text-brand transition-colors"
                  >
                    hello@floristmarket.ro
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <a 
                    href="tel:+40721123456" 
                    className="hover:text-brand transition-colors"
                  >
                    +40 721 123 456
                  </a>
                </div>
              </div>
            </div>

            {/* Social media */}
            <div>
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Urmărește-ne</h3>
              <div className="flex gap-4">
                <a
                  href="https://facebook.com/floristmarketro"
                  target="_blank"
                  rel="nofollow noopener"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </a>
                <a
                  href="https://instagram.com/floristmarketro"
                  target="_blank"
                  rel="nofollow noopener"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </a>
                <a
                  href="https://tiktok.com/@floristmarketro"
                  target="_blank"
                  rel="nofollow noopener"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="TikTok"
                >
                  <Music2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </a>
                <a
                  href="https://linkedin.com/company/floristmarketro"
                  target="_blank"
                  rel="nofollow noopener"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </a>
                <a
                  href="https://youtube.com/@floristmarketro"
                  target="_blank"
                  rel="nofollow noopener"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ANPC section */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">Soluționare online:</span>
              <a
                href="https://anpc.ro"
                target="_blank"
                rel="nofollow noopener"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="ANPC - Autoritatea Națională pentru Protecția Consumatorilor"
              >
                <svg
                  width="60"
                  height="20"
                  viewBox="0 0 60 20"
                  className="text-slate-600 dark:text-slate-300"
                  fill="currentColor"
                >
                  <text x="0" y="15" fontSize="12" fontWeight="bold">ANPC</text>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            © {currentYear} FloristMarket.ro – Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  );
}
