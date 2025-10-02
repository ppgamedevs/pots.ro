/**
 * Component pentru ștergerea contului utilizatorului
 * GDPR-light implementare cu soft-delete și confirmare
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAccountDialogProps {
  userId?: string;
  userEmail?: string;
}

export function DeleteAccountDialog({ userId, userEmail }: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const expectedText = 'ȘTERGE CONTUL';

  const handleDeleteAccount = async () => {
    if (confirmationText !== expectedText) {
      toast.error('Te rugăm să introduci exact textul "ȘTERGE CONTUL"');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested account deletion',
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        toast.success('Cererea de ștergere a fost trimisă');
        
        // Redirecționează către logout după 3 secunde
        setTimeout(() => {
          window.location.href = '/api/auth/logout';
        }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Eroare la ștergerea contului');
      }
    } catch (error) {
      toast.error('Eroare de rețea');
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Mail className="h-5 w-5" />
            Cerere trimisă
          </CardTitle>
          <CardDescription className="text-red-700">
            Procesul de ștergere a contului a fost inițiat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Am trimis un email de confirmare la adresa <strong>{userEmail}</strong>. 
                Contul tău va fi șters definitiv în următoarele 24 de ore.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-red-700">
              Vei fi deconectat automat din aplicație în câteva secunde...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Șterge contul
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Șterge contul
          </DialogTitle>
          <DialogDescription>
            Această acțiune este ireversibilă. Toate datele tale vor fi șterse definitiv.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenție!</strong> Această acțiune va șterge:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Toate comenzile tale</li>
                <li>Informațiile de profil</li>
                <li>Istoricul de mesaje</li>
                <li>Toate datele asociate contului</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Pentru a confirma, scrie <strong>ȘTERGE CONTUL</strong>:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="ȘTERGE CONTUL"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationText !== expectedText || isDeleting}
            >
              {isDeleting ? 'Se șterge...' : 'Șterge definitiv'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
