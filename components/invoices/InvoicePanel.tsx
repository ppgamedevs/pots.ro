'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  type: 'commission' | 'seller' | 'platform';
  series: string;
  number: string;
  pdfUrl: string;
  total: number;
  currency: string;
  issuer: 'smartbill' | 'facturis' | 'mock' | 'seller';
  status: 'issued' | 'voided' | 'error';
  sellerInvoiceNumber?: string;
  createdAt: string;
}

interface InvoicePanelProps {
  orderId: string;
  invoices?: Invoice[]; // Suportă multiple facturi
  invoice?: Invoice; // Backward compatibility
}

type InvoiceState = 'idle' | 'loading' | 'ready' | 'error';

export function InvoicePanel({ orderId, invoices, invoice }: InvoicePanelProps) {
  // Normalizează: dacă avem invoice vechi, îl convertim în array
  const invoiceList = invoices || (invoice ? [invoice] : []);
  const [state, setState] = useState<InvoiceState>(invoiceList.length > 0 ? 'ready' : 'idle');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async (inv: Invoice) => {
    setIsDownloading(true);
    setState('loading');

    try {
      // Pentru facturi de tip 'seller', folosim direct URL-ul PDF
      if (inv.type === 'seller' && inv.pdfUrl) {
        window.open(inv.pdfUrl, '_blank');
        toast.success('Factura a fost deschisă!');
        setState('ready');
        setIsDownloading(false);
        return;
      }

      const response = await fetch(`/api/invoices/${inv.id}/pdf`, {
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
      link.download = `factura-${inv.series}-${inv.number}.pdf`;
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

  const getStatusBadge = (inv?: Invoice) => {
    const invoiceToCheck = inv || invoiceList[0];
    if (!invoiceToCheck) return null;

    switch (invoiceToCheck.status) {
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

  const getIssuerLabel = (invoice: Invoice) => {
    switch (invoice.issuer) {
      case 'smartbill':
        return 'SmartBill';
      case 'facturis':
        return 'Facturis';
      case 'mock':
        return 'Demo';
      case 'seller':
        return 'Vânzător';
      default:
        return 'Necunoscut';
    }
  };

  const getInvoiceTypeLabel = (type: Invoice['type']) => {
    switch (type) {
      case 'commission':
        return 'Factură comision';
      case 'seller':
        return 'Factură vânzător';
      case 'platform':
        return 'Factură produse platformă';
      default:
        return 'Factură';
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

  if (invoiceList.length === 0) return null;

  // Dacă avem o singură factură, afișăm formatul simplu (backward compatibility)
  if (invoiceList.length === 1) {
    const singleInvoice = invoiceList[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getInvoiceTypeLabel(singleInvoice.type)} #{singleInvoice.series}-{singleInvoice.number}
            {singleInvoice.sellerInvoiceNumber && (
              <span className="text-sm font-normal text-muted-foreground">
                ({singleInvoice.sellerInvoiceNumber})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {singleInvoice.type === 'commission' 
              ? 'Factura de comision emisă de platformă'
              : singleInvoice.type === 'seller'
              ? 'Factura emisă de vânzător'
              : 'Factura pentru produsele platformei'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Total: {new Intl.NumberFormat('ro-RO', {
                  style: 'currency',
                  currency: singleInvoice.currency,
                }).format(Number(singleInvoice.total))}
              </p>
              <p className="text-xs text-muted-foreground">
                Emisă prin: {getIssuerLabel(singleInvoice)}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleDownloadInvoice(singleInvoice)}
              disabled={isDownloading || singleInvoice.status !== 'issued'}
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

  // Dacă avem multiple facturi, afișăm lista
  return (
    <div className="space-y-4">
      {invoiceList.map((inv) => (
        <Card key={inv.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {getInvoiceTypeLabel(inv.type)} #{inv.series}-{inv.number}
              {inv.sellerInvoiceNumber && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({inv.sellerInvoiceNumber})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {inv.type === 'commission' 
                ? 'Factura de comision emisă de platformă'
                : inv.type === 'seller'
                ? 'Factura emisă de vânzător'
                : 'Factura pentru produsele platformei'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Total: {new Intl.NumberFormat('ro-RO', {
                    style: 'currency',
                    currency: inv.currency,
                  }).format(Number(inv.total))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emisă prin: {getIssuerLabel(inv)}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleDownloadInvoice(inv)}
                disabled={isDownloading || inv.status !== 'issued'}
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
