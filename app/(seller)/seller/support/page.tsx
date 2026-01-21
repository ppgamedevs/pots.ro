'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

type TicketMessage = {
  id: string;
  body: string;
  createdAt: string;
  authorId?: string | null;
};

type ConversationPayload = {
  conversation: { id: string; sellerId: string };
  messages: Array<{ id: string; body: string; authorRole: string; createdAt: string }>;
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

function statusVariant(status?: string) {
  if (status === 'open') return 'brand';
  if (status === 'in_progress') return 'warning';
  if (status === 'waiting_on_seller') return 'secondary';
  if (status === 'resolved') return 'success';
  if (status === 'closed') return 'neutral';
  return 'secondary';
}

export default function SellerSupportPage() {
  const { data: ticketsData, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } = useSWR<{ items: Ticket[] }>(
    '/api/seller/support/tickets',
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: convoData, error: convoError, isLoading: convoLoading, mutate: mutateConvo } = useSWR<ConversationPayload>(
    '/api/seller/support/conversation',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const selectedTicket = useMemo(() => (ticketsData?.items || []).find((t) => t.id === selectedTicketId), [ticketsData, selectedTicketId]);

  const { data: ticketMessages, error: ticketMessagesError, isLoading: ticketMessagesLoading, mutate: mutateTicketMessages } = useSWR<{ items: TicketMessage[] }>(
    selectedTicketId ? `/api/seller/support/tickets/${selectedTicketId}/messages` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [ticketReply, setTicketReply] = useState('');
  const [conversationText, setConversationText] = useState('');

  const createTicket = async () => {
    const title = ticketTitle.trim();
    if (!title) return;

    const res = await fetch('/api/seller/support/tickets', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: ticketDesc.trim() || null }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut crea tichetul');
      return;
    }

    setTicketTitle('');
    setTicketDesc('');
    await mutateTickets();
    toast.success('Tichet creat');
  };

  const sendTicketMessage = async () => {
    const body = ticketReply.trim();
    if (!selectedTicketId || !body) return;

    const res = await fetch(`/api/seller/support/tickets/${selectedTicketId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut trimite mesajul');
      return;
    }

    setTicketReply('');
    await mutateTicketMessages();
    await mutateTickets();
  };

  const sendConversationMessage = async () => {
    const body = conversationText.trim();
    if (!body) return;

    const res = await fetch('/api/seller/support/conversation', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut trimite mesajul');
      return;
    }

    setConversationText('');
    await mutateConvo();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Suport</h1>
        <p className="text-slate-600 dark:text-slate-300">Tichete + conversație directă cu echipa de suport.</p>
      </header>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Tichete</TabsTrigger>
          <TabsTrigger value="chat">Conversație</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card hover={false}>
              <CardHeader>
                <CardTitle className="text-xl">Creează tichet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Titlu" />
                <Textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} placeholder="Descriere (opțional)" rows={4} />
                <Button onClick={createTicket} disabled={!ticketTitle.trim()}>
                  Creează
                </Button>
                <p className="text-xs text-slate-500">Statusul și prioritățile sunt gestionate de suport/admin.</p>
              </CardContent>
            </Card>

            <Card hover={false}>
              <CardHeader>
                <CardTitle className="text-xl">Tichetele mele</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketsError ? (
                  <div className="text-sm text-red-600">Eroare: {String((ticketsError as any)?.message || ticketsError)}</div>
                ) : ticketsLoading && (ticketsData?.items || []).length === 0 ? (
                  <div className="text-sm text-slate-500">Se încarcă…</div>
                ) : (ticketsData?.items || []).length === 0 ? (
                  <div className="text-sm text-slate-500">Nu ai niciun tichet încă.</div>
                ) : (
                  <div className="space-y-2">
                    {(ticketsData?.items || []).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full text-left rounded-xl border p-3 transition ${selectedTicketId === t.id ? 'border-brand' : 'border-slate-200 dark:border-white/10'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-sm">{t.title}</div>
                          <div className="flex gap-2">
                            <Badge variant={statusVariant(t.status) as any}>{t.status}</Badge>
                            <Badge variant="secondary">{t.priority}</Badge>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Updated: {new Date(t.updatedAt).toLocaleString('ro-RO')}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <Button variant="outline" size="sm" onClick={() => mutateTickets()}>
                    Reîncarcă
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedTicket && (
            <Card hover={false} className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">{selectedTicket.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTicket.description && (
                  <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{selectedTicket.description}</div>
                )}

                <div className="flex gap-2">
                  <Badge variant={statusVariant(selectedTicket.status) as any}>{selectedTicket.status}</Badge>
                  <Badge variant="secondary">{selectedTicket.priority}</Badge>
                </div>

                {ticketMessagesError ? (
                  <div className="text-sm text-red-600">Eroare: {String((ticketMessagesError as any)?.message || ticketMessagesError)}</div>
                ) : ticketMessagesLoading ? (
                  <div className="text-sm text-slate-500">Se încarcă mesajele…</div>
                ) : (
                  <div className="space-y-2">
                    {(ticketMessages?.items || []).map((m) => (
                      <div key={m.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                        <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString('ro-RO')}</div>
                        <div className="mt-1 text-sm whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                    {ticketMessages && (ticketMessages.items || []).length === 0 && (
                      <div className="text-sm text-slate-500">Niciun mesaj încă.</div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Textarea value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Scrie un răspuns…" rows={3} />
                  <Button onClick={sendTicketMessage} disabled={!ticketReply.trim()}>
                    Trimite mesaj
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <Card hover={false}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-xl">Conversație 1:1</CardTitle>
              <Button variant="outline" size="sm" onClick={() => mutateConvo()}>
                Reîncarcă
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {convoError ? (
                <div className="text-sm text-red-600">Eroare: {String((convoError as any)?.message || convoError)}</div>
              ) : convoLoading ? (
                <div className="text-sm text-slate-500">Se încarcă…</div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
                  {(convoData?.messages || []).map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString('ro-RO')}</div>
                        <Badge variant="secondary">{m.authorRole}</Badge>
                      </div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                  {convoData && (convoData.messages || []).length === 0 && (
                    <div className="text-sm text-slate-500">Niciun mesaj încă.</div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Textarea value={conversationText} onChange={(e) => setConversationText(e.target.value)} placeholder="Scrie un mesaj…" rows={3} />
                <Button onClick={sendConversationMessage} disabled={!conversationText.trim()}>
                  Trimite
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
