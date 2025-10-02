/**
 * Component pentru detectarea și blocarea contactelor în chat
 * Regex pentru email/telefon, masking, rate-limit
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Mail, Phone, MessageSquare, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AntiBypassHintProps {
  onMessageSend: (message: string) => void;
  conversationId: string;
  isNewSeller?: boolean;
  className?: string;
}

export function AntiBypassHint({
  onMessageSend,
  conversationId,
  isNewSeller = false,
  className = ''
}: AntiBypassHintProps) {
  const [message, setMessage] = useState('');
  const [hasContactPattern, setHasContactPattern] = useState(false);
  const [maskedMessage, setMaskedMessage] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [attempts24h, setAttempts24h] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Regex patterns pentru detectarea contactelor
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(\+?\d[\s\-()]?){7,}/g;

  // Verifică dacă mesajul conține contacte
  const checkForContacts = (text: string) => {
    const hasEmail = emailRegex.test(text);
    const hasPhone = phoneRegex.test(text);
    return hasEmail || hasPhone;
  };

  // Mascarează contactele din text
  const maskContacts = (text: string) => {
    let masked = text;
    
    // Mascarează email-urile
    masked = masked.replace(emailRegex, (email) => {
      const [local, domain] = email.split('@');
      const maskedLocal = local.length > 2 
        ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
        : local[0] + '*';
      const maskedDomain = domain.split('.').map(part => 
        part.length > 2 
          ? part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
          : part[0] + '*'
      ).join('.');
      return `${maskedLocal}@${maskedDomain}`;
    });

    // Mascarează numerele de telefon
    masked = masked.replace(phoneRegex, (phone) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 7) {
        const visibleDigits = Math.min(2, digits.length);
        const maskedDigits = '*'.repeat(digits.length - visibleDigits);
        return phone.replace(digits, digits.slice(0, visibleDigits) + maskedDigits);
      }
      return phone;
    });

    return masked;
  };

  // Verifică banner pentru selleri noi
  useEffect(() => {
    if (isNewSeller) {
      const bannerShown = localStorage.getItem(`banner_shown_${conversationId}`);
      if (!bannerShown) {
        setShowBanner(true);
      }
    }
  }, [isNewSeller, conversationId]);

  // Verifică încercările din ultimele 24h
  useEffect(() => {
    const attempts = localStorage.getItem(`attempts_${conversationId}`);
    if (attempts) {
      const attemptsData = JSON.parse(attempts);
      const now = Date.now();
      const dayAgo = now - (24 * 60 * 60 * 1000);
      
      if (attemptsData.timestamp > dayAgo) {
        setAttempts24h(attemptsData.count);
      } else {
        localStorage.removeItem(`attempts_${conversationId}`);
        setAttempts24h(0);
      }
    }
  }, [conversationId]);

  // Verifică mesajul pentru contacte
  useEffect(() => {
    const hasContacts = checkForContacts(message);
    setHasContactPattern(hasContacts);
    
    if (hasContacts) {
      setMaskedMessage(maskContacts(message));
    } else {
      setMaskedMessage(message);
    }
  }, [message]);

  // Trimite mesajul
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Te rugăm să introduci un mesaj');
      return;
    }

    if (hasContactPattern) {
      // Incrementează contorul de încercări
      const attempts = localStorage.getItem(`attempts_${conversationId}`);
      const attemptsData = attempts ? JSON.parse(attempts) : { count: 0, timestamp: Date.now() };
      attemptsData.count += 1;
      attemptsData.timestamp = Date.now();
      localStorage.setItem(`attempts_${conversationId}`, JSON.stringify(attemptsData));
      setAttempts24h(attemptsData.count);

      // Dacă sunt mai mult de 3 încercări în 24h, setează flag
      if (attemptsData.count >= 3) {
        toast.error('Prea multe încercări de contact direct. Mesajul a fost blocat.');
        return;
      }

      toast.error('Mesajele cu contacte directe sunt blocate. Folosește mesageria internă.');
      return;
    }

    onMessageSend(message.trim());
    setMessage('');
  };

  // Închide banner
  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem(`banner_shown_${conversationId}`, 'true');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Banner pentru selleri noi */}
      {showBanner && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Bun venit!</strong> Pentru a proteja datele personale, 
                contactele directe (email, telefon) sunt blocate în mesagerie. 
                Folosește mesageria internă pentru comunicare sigură.
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseBanner}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Avertizare pentru încercări multiple */}
      {attempts24h > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Ai încercat să trimiți contacte directe de {attempts24h} ori în ultimele 24h. 
            După 3 încercări, mesajele vor fi blocate automat.
          </AlertDescription>
        </Alert>
      )}

      {/* Editor mesaje */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Mesaj nou</span>
          {hasContactPattern && (
            <Badge variant="destructive" className="text-xs">
              Contact detectat
            </Badge>
          )}
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrie mesajul tău aici..."
            className={`min-h-[100px] ${hasContactPattern ? 'border-red-300 bg-red-50' : ''}`}
            disabled={attempts24h >= 3}
          />
          
          {/* Tooltip pentru contacte detectate */}
          {hasContactPattern && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Folosește mesageria internă; contactele directe sunt blocate de Termeni.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Previzualizare mesaj mascat */}
        {hasContactPattern && maskedMessage !== message && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Previzualizare mesaj:</div>
            <div className="text-sm text-gray-800">{maskedMessage}</div>
          </div>
        )}

        {/* Indicatori contacte detectate */}
        {hasContactPattern && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <Mail className="h-3 w-3" />
            <Phone className="h-3 w-3" />
            <span>Contacte detectate în mesaj</span>
          </div>
        )}

        {/* Buton trimite */}
        <div className="flex justify-end">
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || hasContactPattern || attempts24h >= 3}
            className="min-w-[100px]"
          >
            {attempts24h >= 3 ? 'Blocat' : 'Trimite'}
          </Button>
        </div>
      </div>

      {/* Informații despre politică */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="font-medium mb-1">Politica de contact:</div>
        <ul className="space-y-1">
          <li>• Email-urile și numerele de telefon sunt detectate automat</li>
          <li>• Contactele directe sunt blocate pentru protecția datelor</li>
          <li>• Folosește mesageria internă pentru comunicare sigură</li>
          <li>• După 3 încercări în 24h, mesajele sunt blocate automat</li>
        </ul>
      </div>
    </div>
  );
}
