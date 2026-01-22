'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { UITabs } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  const [internalNote, setInternalNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [emailSending, setEmailSending] = useState<null | 'paid' | 'shipped' | 'delivered'>(null);

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

  const addInternalNote = async () => {
    if (!internalNote.trim()) return;
    try {
      setNoteSaving(true);
      const res = await fetch(`/api/orders/${orderId}/internal-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: internalNote.trim() }),
        credentials: 'include',
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.error || 'Nu s-a putut salva nota';
        throw new Error(msg);
      }
      setInternalNote('');
      toast.success('Notă internă salvată');
      mutate();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setNoteSaving(false);
    }
  };

  const resendEmail = async (type: 'paid' | 'shipped' | 'delivered') => {
    try {
      setEmailSending(type);
      const res = await fetch(`/api/orders/${orderId}/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Nu s-a putut retrimite email-ul');
      }
      toast.success('Email retrimis');
      mutate();
    } catch (e: any) {
      toast.error(e?.message || 'Eroare');
    } finally {
      setEmailSending(null);
    }
  };

  const handleMessageSent = (newMessage: any) => {
    setMessages(prev => [...prev, newMessage]);
  };

  const formatCurrencyFromCents = (amountCents: number) => {
    const currency = (order as any)?.currency || 'RON';
    const amount = (Number(amountCents) || 0) / 100;
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
    }).format(amount);
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

  const auditTimeline = ((order as any)?.auditTrail || []) as Array<{
    action: string;
    actorRole?: string | null;
    createdAt?: string | null;
    meta?: any;
  }>;

  function formatAuditAction(action: string) {
    if (action === 'status_change') return 'Status schimbat';
    if (action === 'awb_created') return 'AWB creat';
    if (action === 'webhook_update') return 'Tracking update (webhook)';
    if (action === 'request_return') return 'Retur cerut';
    if (action === 'approve_return') return 'Retur aprobat';
    return action;
  }

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
          title={`Comandă ${(order as any).orderNumber || `#${order.id.slice(-8).toUpperCase()}`}`}
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
                        <p className="font-medium">{formatCurrencyFromCents((item as any).subtotalCents ?? (item as any).subtotal ?? 0)}</p>
                        <p className="text-sm text-gray-600">{formatCurrencyFromCents((item as any).unitPriceCents ?? (item as any).unitPrice ?? 0)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrencyFromCents((order as any).totals?.subtotalCents ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrencyFromCents((order as any).totals?.shippingFeeCents ?? 0)}</span>
                    </div>
                    {Number((order as any).totals?.totalDiscountCents ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatCurrencyFromCents((order as any).totals?.totalDiscountCents ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrencyFromCents((order as any).totals?.totalCents ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            {Array.isArray((order as any).invoices) && (order as any).invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Facturi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(order as any).invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between gap-4">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <div className="font-medium">{inv.series}{inv.number}</div>
                          <div className="text-slate-500">{inv.status} • {inv.issuer}</div>
                        </div>
                        {inv.pdfUrl ? (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            Deschide PDF
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {auditTimeline.length === 0 ? (
                    <div className="text-sm text-slate-500">Nu există evenimente în audit trail.</div>
                  ) : (
                    auditTimeline.map((event, index) => (
                      <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">{formatAuditAction(event.action)}</p>
                        <p className="text-sm text-gray-600">
                          {event.createdAt ? formatDate(event.createdAt) : 'Unknown date'} by {event.actorRole || 'system'}
                        </p>
                      </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notă internă</div>
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={4}
                    placeholder="Scrie o notă internă (vizibilă doar în admin/support)…"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button onClick={addInternalNote} disabled={noteSaving || !internalNote.trim()} size="sm">
                      {noteSaving ? 'Salvez…' : 'Salvează nota'}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Retrimite email</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => resendEmail('paid')}
                      disabled={emailSending !== null}
                    >
                      {emailSending === 'paid' ? 'Trimit…' : 'Paid'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => resendEmail('shipped')}
                      disabled={emailSending !== null}
                    >
                      {emailSending === 'shipped' ? 'Trimit…' : 'Shipped'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => resendEmail('delivered')}
                      disabled={emailSending !== null}
                    >
                      {emailSending === 'delivered' ? 'Trimit…' : 'Delivered'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                              <p>Status: <Badge variant="default" className="text-white">{order.status}</Badge></p>
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
