'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  series: string;
  number: string;
  pdfUrl: string;
  total: number;
  currency: string;
  issuer: 'smartbill' | 'facturis' | 'mock';
  status: 'issued' | 'voided' | 'error';
  createdAt: string;
}

interface InvoicePanelProps {
  orderId: string;
  invoice?: Invoice;
}

type InvoiceState = 'idle' | 'loading' | 'ready' | 'error';

export function InvoicePanel({ orderId, invoice }: InvoicePanelProps) {
  const [state, setState] = useState<InvoiceState>(invoice ? 'ready' : 'idle');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!invoice) return;

    setIsDownloading(true);
    setState('loading');

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoice.series}-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setState('ready');
      toast.success('Factura a fost descărcată cu succes!');
    } catch (error) {
      console.error('Download invoice error:', error);
      setState('error');
      toast.error('Nu s-a putut descărca factura. Încercați din nou.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = () => {
    if (!invoice) return null;

    switch (invoice.status) {
      case 'issued':
        return <Badge variant="success" className="bg-green-100 text-green-800">Emisă</Badge>;
      case 'voided':
        return <Badge variant="secondary">Anulată</Badge>;
      case 'error':
        return <Badge variant="destructive">Eroare</Badge>;
      default:
        return null;
    }
  };

  const getIssuerLabel = () => {
    if (!invoice) return '';
    
    switch (invoice.issuer) {
      case 'smartbill':
        return 'SmartBill';
      case 'facturis':
        return 'Facturis';
      case 'mock':
        return 'Demo';
      default:
        return 'Necunoscut';
    }
  };

  if (state === 'idle') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factura
          </CardTitle>
          <CardDescription>
            Factura va fi generată automat după confirmarea plății
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Factura nu este încă disponibilă</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Eroare factură
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              A apărut o problemă cu factura pentru această comandă.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setState('idle')}
              className="w-full"
            >
              Încercați din nou
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Factura #{invoice.series}-{invoice.number}
        </CardTitle>
        <CardDescription>
          Factura este emisă automat la confirmarea plății
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Total: {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: invoice.currency,
              }).format(invoice.total / 100)}
            </p>
            <p className="text-xs text-muted-foreground">
              Emisă prin: {getIssuerLabel()}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownloadInvoice}
            disabled={isDownloading || invoice.status !== 'issued'}
            className="flex-1"
            aria-label="Descarcă factura în format PDF"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se descarcă...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descarcă factura (PDF)
              </>
            )}
          </Button>
        </div>

        <div 
          className="text-xs text-muted-foreground"
          aria-live="polite"
        >
          <p>
            Factura este disponibilă în format PDF și poate fi descărcată oricând.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
