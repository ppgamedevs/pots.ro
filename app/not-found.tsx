'use client';

/**
 * Pagina 404 - Nu a fost găsită
 * Design simplu și consistent cu brandul FloristMarket.ro
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-4xl font-bold text-green-600 mb-2">
              FloristMarket.ro
            </div>
            <div className="text-sm text-gray-600">
              Platforma ta de plante
            </div>
          </Link>
        </div>

        {/* Card principal */}
        <Card className="text-center">
          <CardHeader>
            <div className="text-6xl mb-4">🌱</div>
            <CardTitle className="text-2xl text-gray-800">
              Pagina nu a fost găsită
            </CardTitle>
            <CardDescription className="text-lg">
              Se pare că pagina pe care o cauți nu există sau a fost mutată.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Nu-ți face griji! Poți să:
            </p>
            
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Mergi la pagina principală
                </Button>
              </Link>
              
              <Link href="/cautare" className="block">
                <Button variant="outline" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Caută produse
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la pagina anterioară
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Dacă crezi că aceasta este o eroare, te rugăm să ne contactezi.
              </p>
              <Link href="/contact" className="text-green-600 hover:text-green-700 text-sm">
                Contactează-ne
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer simplu */}
        <div className="text-center mt-8 text-xs text-gray-500">
          © 2024 FloristMarket.ro - Toate drepturile rezervate
        </div>
      </div>
    </div>
  );
}
