'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { UITabs } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, PackageIcon, UserIcon, MapPinIcon, ClockIcon } from 'lucide-react';
import { OrderDetail } from '@/lib/types';
import { getOrder } from '@/lib/api/orders';
import { getConversation, getMessages } from '@/lib/api/messages';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { OrderActions } from '@/components/orders/OrderActions';
import { ConversationTab } from '@/components/orders/ConversationTab';
import { MessageComposer } from '@/components/orders/MessageComposer';
import { useOrderKeyboardShortcuts } from '@/lib/keyboard';
import { toast } from 'sonner';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  // Enable keyboard shortcuts
  useOrderKeyboardShortcuts(orderId);
  
  const [activeTab, setActiveTab] = useState('details');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasWarning, setHasWarning] = useState(false);

  const { data: order, error, isLoading, mutate } = useSWR(
    ['order', orderId],
    () => getOrder(orderId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Load conversation and messages
  useSWR(
    order ? ['conversation', order.id] : null,
    async () => {
      if (!order) return null;
      
      try {
        const conversation = await getConversation(order.id);
        setConversationId(conversation.conversationId);
        
        const messagesData = await getMessages(conversation.conversationId);
        setMessages(messagesData.messages);
        
        return conversation;
      } catch (error) {
        console.error('Failed to load conversation:', error);
        return null;
      }
    },
    {
      revalidateOnFocus: false,
    }
  );

  const handleOrderUpdate = () => {
    mutate();
  };

  const handleMessageSent = (newMessage: any) => {
    setMessages(prev => [...prev, newMessage]);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock audit timeline for demonstration
  const auditTimeline = [
    { action: 'Order created', timestamp: order?.createdAt, actor: 'System' },
    { action: 'Payment received', timestamp: order?.createdAt, actor: 'Customer' },
    { action: 'Order packed', timestamp: order?.createdAt, actor: 'Seller' },
    { action: 'Order shipped', timestamp: order?.createdAt, actor: 'Seller' },
  ].filter(Boolean);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Comandă negăsită</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Comanda pe care o cauți nu există sau nu ai acces la ea.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Înapoi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <main role="main">
        <AdminPageWrapper 
          title={`Comandă #${order.id.slice(-8).toUpperCase()}`}
          description={`Creată pe ${formatDate(order.createdAt)}`}
          customBreadcrumbLabel="Detalii Comandă"
          backButtonHref="/admin/orders"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusStepper status={order.status} />
                {order.deliveryStatus && (
                  <div className="mt-4">
                    <Badge variant="outline">
                      Delivery: {order.deliveryStatus}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.totals.shipping)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(order.totals.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.county}</p>
                  <p>{order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Audit Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditTimeline.map((event, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-gray-600">
                          {event.timestamp ? formatDate(event.timestamp) : 'Unknown date'} by {event.actor || 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <OrderActions
              order={order}
              role="admin"
              onOrderUpdate={handleOrderUpdate}
            />

            {/* Messages Tab */}
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <UITabs
                  defaultValue="details"
                  tabs={[
                    {
                      value: "details",
                      label: "Details",
                      content: (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Order Information</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Status: <Badge>{order.status}</Badge></p>
                              <p>Created: {formatDate(order.createdAt)}</p>
                              {order.awbNumber && <p>AWB: {order.awbNumber}</p>}
                              {order.deliveredAt && <p>Delivered: {formatDate(order.deliveredAt)}</p>}
                              {order.canceledReason && <p>Cancel Reason: {order.canceledReason}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    },
                    {
                      value: "messages",
                      label: "Messages",
                      content: (
                        <div className="space-y-4">
                          <ConversationTab
                            messages={messages}
                            currentUserId="admin-user-id" // This should come from auth context
                            hasWarning={hasWarning}
                          />
                          
                          {conversationId && (
                            <MessageComposer
                              conversationId={conversationId}
                              onMessageSent={handleMessageSent}
                            />
                          )}
                        </div>
                      )
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        </AdminPageWrapper>
      </main>
    </div>
  );
}
