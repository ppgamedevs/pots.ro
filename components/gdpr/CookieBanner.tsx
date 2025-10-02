/**
 * Banner simplu pentru cookie-uri funcționale
 * GDPR-light implementare pentru Pots.ro
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifică dacă utilizatorul a acceptat deja cookie-urile
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                Cookie-uri funcționale
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Acest site folosește cookie-uri funcționale pentru a îmbunătăți experiența ta de navigare. 
                Cookie-urile ne ajută să ne amintim preferințele tale și să funcționăm corect.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleAccept} size="sm">
                  Acceptă
                </Button>
                <Button onClick={handleDecline} variant="outline" size="sm">
                  Refuză
                </Button>
              </div>
            </div>
            <Button
              onClick={handleDecline}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
