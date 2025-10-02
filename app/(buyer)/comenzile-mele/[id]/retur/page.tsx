/**
 * Pagina pentru buyer să solicite returul unei comenzi
 * Integrează BuyerReturnForm cu datele comenzii
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BuyerReturnForm } from '@/components/retur/BuyerReturnForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/money';

interface Order {
  id: string;
  status: string;
  total: number;
  deliveredAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
  };
}

export default function BuyerReturnPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returnStatus, setReturnStatus] = useState<'delivered' | 'return_requested' | 'return_approved' | 'returned'>('delivered');

  // Simulează încărcarea comenzii
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        
        // Simulare date comandă (în realitate ar fi un API call)
        const mockOrder: Order = {
          id: orderId,
          status: 'delivered',
          total: 245.50,
          deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 zile în urmă
          items: [
            {
              id: '1',
              name: 'Produs Demo 1',
              quantity: 2,
              price: 75.00,
              image: '/placeholder-product.jpg'
            },
            {
              id: '2',
              name: 'Produs Demo 2',
              quantity: 1,
              price: 95.50,
              image: '/placeholder-product.jpg'
            }
          ],
          shippingAddress: {
            name: 'Ion Popescu',
            address: 'Strada Exemplu, Nr. 123',
            city: 'București',
            postalCode: '010101'
          }
        };

        // Simulează delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setOrder(mockOrder);
        
        // Determină statusul returului pe baza statusului comenzii
        switch (mockOrder.status) {
          case 'return_requested':
            setReturnStatus('return_requested');
            break;
          case 'return_approved':
            setReturnStatus('return_approved');
            break;
          case 'returned':
            setReturnStatus('returned');
            break;
          default:
            setReturnStatus('delivered');
        }
        
      } catch (error) {
        toast.error('Eroare la încărcarea comenzii');
        console.error('Error loading order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const handleReturnRequested = () => {
    setReturnStatus('return_requested');
    toast.success('Solicitarea de retur a fost trimisă cu succes');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Comanda nu a fost găsită</h1>
          <p className="text-gray-600 mb-6">
            Comanda cu ID-ul {orderId} nu există sau nu ai permisiunea să o accesezi.
          </p>
          <Link href="/comenzile-mele">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la comenzi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/comenzile-mele">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Solicită Retur</h1>
              <p className="text-gray-600">Comanda #{order.id}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {order.status === 'delivered' ? 'Livrată' : order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detalii comandă */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalii comandă
                </CardTitle>
                <CardDescription>
                  Informații despre comanda pe care dorești să o returnezi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Produse */}
                <div>
                  <h4 className="font-medium mb-3">Produse comandate</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            Cantitate: {item.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity, 'RON')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span>Total comandă:</span>
                    <span>{formatCurrency(order.total, 'RON')}</span>
                  </div>
                </div>

                {/* Data livrare */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Livrată pe: {new Date(order.deliveredAt).toLocaleDateString('ro-RO')}
                  </span>
                </div>

                {/* Adresă livrare */}
                <div>
                  <h4 className="font-medium mb-2">Adresă livrare</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div>{order.shippingAddress.name}</div>
                    <div>{order.shippingAddress.address}</div>
                    <div>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formular retur */}
          <div>
            <BuyerReturnForm
              orderId={order.id}
              orderTotal={order.total}
              deliveredAt={order.deliveredAt}
              currentStatus={returnStatus}
              onReturnRequested={handleReturnRequested}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
