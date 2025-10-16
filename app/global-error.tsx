/**
 * Global Error Boundary pentru aplicația Pots.ro
 * Captează erorile și afișează o pagină prietenoasă
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log eroarea pentru debugging
    console.error('Global error caught:', error);
  }, [error]);

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
              Oops! Ceva nu a mers bine
            </CardTitle>
            <CardDescription className="text-lg">
              A apărut o eroare neașteptată în aplicație.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Eroare aplicație</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {error.message || 'Eroare necunoscută'}
              </p>
            </div>
            
            <p className="text-gray-600">
              Încearcă să:
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={reset}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Încearcă din nou
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Mergi la pagina principală
                </Button>
              </Link>
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

            {/* Debug info pentru development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Detalii tehnice (development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
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
