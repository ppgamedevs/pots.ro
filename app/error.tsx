/**
 * Pagina 500 - Eroare server
 * Design simplu și consistent cu brandul Pots.ro
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ServerError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
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
            <div className="text-6xl mb-4">⚠️</div>
            <CardTitle className="text-2xl text-gray-800">
              Eroare server
            </CardTitle>
            <CardDescription className="text-lg">
              Ne pare rău, dar a apărut o problemă tehnică pe serverul nostru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Eroare 500</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Echipa noastră tehnică a fost notificată și lucrează la rezolvarea problemei.
              </p>
            </div>
            
            <p className="text-gray-600">
              Încearcă să:
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reîncarcă pagina
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Mergi la pagina principală
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
              <p className="text-sm text-gray-500 mb-2">
                Dacă problema persistă, te rugăm să ne contactezi.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/contact" className="text-green-600 hover:text-green-700 text-sm">
                  Contactează-ne
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/ajutor" className="text-green-600 hover:text-green-700 text-sm">
                  Ajutor
                </Link>
              </div>
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
