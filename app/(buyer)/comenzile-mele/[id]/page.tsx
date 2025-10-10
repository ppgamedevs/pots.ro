'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UITabs } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { InvoicePanel } from '@/components/invoices/InvoicePanel';
import { toast } from 'sonner';

// Mock data pentru demonstrație
const mockOrder = {
  id: 'ORD-12345678',
  status: 'delivered',
  createdAt: '2024-12-10T10:30:00Z',
  deliveredAt: '2024-12-15T14:20:00Z',
  totalCents: 12900,
  currency: 'RON',
  shippingAddress: {
    name: 'Maria Popescu',
    email: 'maria.popescu@email.com',
    phone: '+40712345678',
    address: 'Strada Mihai Viteazu 15',
    city: 'București',
    postalCode: '010001',
    country: 'România'
  },
  items: [
    {
      id: '1',
      productName: 'Vază ceramică - Natur',
      qty: 1,
      unitPrice: 12900,
      subtotal: 12900,
      sellerId: 'seller-1'
    }
  ],
  totals: {
    subtotal: 12900,
    shipping: 0,
    tax: 2451,
    total: 12900
  },
  awbNumber: 'AWB-987654321',
  carrierMeta: {
    carrier: 'Cargus',
    trackingUrl: 'https://cargus.ro/track/AWB-987654321'
  },
  invoice: {
    id: 'inv-123',
    series: 'PO',
    number: '2024-001234',
    pdfUrl: '/api/invoices/inv-123/pdf',
    total: 12900,
    currency: 'RON',
    issuer: 'mock' as const,
    status: 'issued' as const,
    createdAt: '2024-12-10T10:35:00Z'
  }
};

const statusConfig = {
  pending: { 
    label: 'În așteptare', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800' 
  },
  paid: { 
    label: 'Plătită', 
    icon: CheckCircle, 
    color: 'bg-blue-100 text-blue-800' 
  },
  packed: { 
    label: 'Pregătită', 
    icon: Package, 
    color: 'bg-purple-100 text-purple-800' 
  },
  shipped: { 
    label: 'Expediată', 
    icon: Truck, 
    color: 'bg-orange-100 text-orange-800' 
  },
  delivered: { 
    label: 'Livrată', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800' 
  },
  canceled: { 
    label: 'Anulată', 
    icon: AlertCircle, 
    color: 'bg-red-100 text-red-800' 
  }
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState(mockOrder);
  const [loading, setLoading] = useState(false);
  
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Clock;
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };
  
  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };
  
  const handleTrackPackage = () => {
    if (order.carrierMeta?.trackingUrl) {
      window.open(order.carrierMeta.trackingUrl, '_blank');
    } else {
      toast.error('Link-ul de tracking nu este disponibil');
    }
  };
  
  const handleLeaveReview = () => {
    toast.success('Redirecționare către pagina de recenzii...');
    // Aici ar fi navigarea către pagina de recenzii
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Comanda #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Plasată pe {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={`${statusInfo?.color} px-3 py-1`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusInfo?.label}
          </Badge>
        </div>
        
        <UITabs
          defaultValue="details"
          tabs={[
            {
              value: 'details',
              label: 'Detalii',
              content: (
                <div className="space-y-6">
                  {/* Adresa de livrare */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Adresa de livrare</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                        <p>{order.shippingAddress.country}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.shippingAddress.email} • {order.shippingAddress.phone}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Produse */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Produse comandate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.productName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cantitate: {item.qty} × {formatPrice(item.unitPrice, order.currency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.subtotal, order.currency)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Totaluri */}
                      <div className="mt-6 pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatPrice(order.totals.subtotal, order.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Livrare:</span>
                            <span>{formatPrice(order.totals.shipping, order.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TVA:</span>
                            <span>{formatPrice(order.totals.tax, order.currency)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>{formatPrice(order.totals.total, order.currency)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            },
            {
              value: 'invoice',
              label: 'Factura',
              content: (
                <InvoicePanel 
                  orderId={order.id} 
                  invoice={order.invoice} 
                />
              )
            },
            {
              value: 'tracking',
              label: 'Urmărire',
              content: (
                <div className="space-y-6">
                  {order.awbNumber ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          Urmărire livrare
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Număr AWB
                            </label>
                            <p className="font-mono text-lg">{order.awbNumber}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Curier
                            </label>
                            <p className="text-lg">{order.carrierMeta?.carrier || 'Necunoscut'}</p>
                          </div>
                        </div>
                        
                        {order.carrierMeta?.trackingUrl && (
                          <Button 
                            onClick={handleTrackPackage}
                            className="w-full"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Urmărește livrarea
                          </Button>
                        )}
                        
                        {order.deliveredAt && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Comanda a fost livrată</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Pe {formatDate(order.deliveredAt)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Informații de livrare indisponibile</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Comanda nu a fost încă expediată sau informațiile de tracking nu sunt disponibile.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            },
            {
              value: 'messages',
              label: 'Mesaje',
              content: (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Mesaje cu vânzătorul
                      </CardTitle>
                      <CardDescription>
                        Comunică cu vânzătorul despre această comandă
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nu există mesaje</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Nu ai mesaje cu vânzătorul pentru această comandă.
                        </p>
                        <Button>
                          Trimite mesaj
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            }
          ]}
        />
        
        {/* Acțiuni finale */}
        {order.status === 'delivered' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Comanda a fost livrată cu succes!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sperăm că îți place produsul. Lasă o recenzie pentru a ajuta alți cumpărători.
                </p>
                <Button onClick={handleLeaveReview} size="lg">
                  Lasă o recenzie
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
