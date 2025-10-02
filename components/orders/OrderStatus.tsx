/**
 * Component pentru status simplificat al comenzilor
 * Badge status și timeline minimal cu 3 stări principale
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Truck, Clock, AlertCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: 'paid' | 'shipped' | 'delivered' | string;
  className?: string;
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  // Mapează statusurile la cele 3 stări principale
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pending':
        return {
          label: 'Plătită',
          color: 'bg-blue-100 text-blue-800',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'shipped':
      case 'packed':
        return {
          label: 'Expediată',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Truck className="h-3 w-3" />
        };
      case 'delivered':
        return {
          label: 'Livrată',
          color: 'bg-green-100 text-green-800',
          icon: <Package className="h-3 w-3" />
        };
      default:
        return {
          label: 'În procesare',
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="h-3 w-3" />
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Badge className={`${statusInfo.color} ${className}`}>
      {statusInfo.icon}
      <span className="ml-1">{statusInfo.label}</span>
    </Badge>
  );
}

interface OrderTimelineProps {
  status: 'paid' | 'shipped' | 'delivered' | string;
  className?: string;
}

export function OrderTimeline({ status, className = '' }: OrderTimelineProps) {
  const steps = [
    {
      id: 'paid',
      label: 'Plătită',
      icon: <CheckCircle className="h-4 w-4" />,
      completed: ['paid', 'pending', 'shipped', 'packed', 'delivered'].includes(status.toLowerCase()),
      current: ['paid', 'pending'].includes(status.toLowerCase())
    },
    {
      id: 'shipped',
      label: 'Expediată',
      icon: <Truck className="h-4 w-4" />,
      completed: ['shipped', 'packed', 'delivered'].includes(status.toLowerCase()),
      current: ['shipped', 'packed'].includes(status.toLowerCase())
    },
    {
      id: 'delivered',
      label: 'Livrată',
      icon: <Package className="h-4 w-4" />,
      completed: status.toLowerCase() === 'delivered',
      current: status.toLowerCase() === 'delivered'
    }
  ];

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Cerc pentru pas */}
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2
              ${step.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : step.current 
                  ? 'bg-yellow-500 border-yellow-500 text-white'
                  : 'bg-gray-200 border-gray-300 text-gray-500'
              }
            `}
          >
            {step.completed ? (
              <CheckCircle className="h-4 w-4" />
            ) : step.current ? (
              <Clock className="h-4 w-4" />
            ) : (
              step.icon
            )}
          </div>
          
          {/* Label */}
          <span className={`ml-2 text-sm font-medium ${
            step.completed 
              ? 'text-green-700' 
              : step.current 
                ? 'text-yellow-700'
                : 'text-gray-500'
          }`}>
            {step.label}
          </span>
          
          {/* Linie de conectare */}
          {index < steps.length - 1 && (
            <div className={`ml-4 w-8 h-0.5 ${
              steps[index + 1].completed || steps[index + 1].current
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface OrderStatusCardProps {
  orderId: string;
  status: 'paid' | 'shipped' | 'delivered' | string;
  updatedAt?: string;
  className?: string;
}

export function OrderStatusCard({ 
  orderId, 
  status, 
  updatedAt, 
  className = '' 
}: OrderStatusCardProps) {
  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pending':
        return 'Comanda a fost plătită și este în procesare. Vei fi notificat când va fi expediată.';
      case 'shipped':
      case 'packed':
        return 'Comanda a fost expediată și este în drum. Vei primi un email cu detaliile de livrare.';
      case 'delivered':
        return 'Comanda a fost livrată cu succes! Mulțumim pentru încredere.';
      default:
        return 'Comanda este în procesare. Vei fi notificat când statusul se va actualiza.';
    }
  };

  const statusMessage = getStatusMessage(status);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Status Comandă #{orderId}
        </CardTitle>
        <CardDescription>
          Urmărește progresul comenzii tale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status curent:</span>
          <OrderStatusBadge status={status} />
        </div>

        {/* Timeline */}
        <div>
          <span className="text-sm font-medium mb-2 block">Progresul comenzii:</span>
          <OrderTimeline status={status} />
        </div>

        {/* Mesaj informativ */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800">{statusMessage}</p>
          </div>
        </div>

        {/* Data ultimei actualizări */}
        {updatedAt && (
          <div className="text-xs text-gray-500">
            Ultima actualizare: {new Date(updatedAt).toLocaleString('ro-RO')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
