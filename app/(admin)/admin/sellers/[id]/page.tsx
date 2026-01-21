'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type SellerDetail = {
  seller: {
    id: string;
    slug: string;
    brandName: string;
    status: string;
    phone?: string | null;
    email?: string | null;
    legalName?: string | null;
    cui?: string | null;
    iban?: string | null;
    about?: string | null;
    createdAt: string;
    updatedAt: string;
    user: { id: string; email?: string | null; name?: string | null };
  };
  stats: {
    ordersCount: number;
    revenueCents: number;
    lastOrderAt: string | null;
    productsCount: number;
    activeProductsCount: number;
  };
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
};

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
  author: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
};

type ConversationPayload = {
  conversation: { id: string; sellerId: string };
  messages: Array<{
    id: string;
    body: string;
    authorRole: string;
    createdAt: string;
    author: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
  }>;
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

function formatMoney(cents: number) {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(value);
}

function statusVariant(status?: string) {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'destructive';
  return 'secondary';
}

export default function AdminSellerDetailPage() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id;

  const { data, error, isLoading, mutate } = useSWR<SellerDetail>(`/api/admin/sellers/${sellerId}`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: notesData, mutate: mutateNotes } = useSWR<{ items: Note[] }>(
    `/api/admin/sellers/${sellerId}/notes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: ticketsData, mutate: mutateTickets } = useSWR<{ items: Ticket[] }>(
    `/api/admin/sellers/${sellerId}/tickets`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: convoData, mutate: mutateConvo } = useSWR<ConversationPayload>(
    `/api/admin/sellers/${sellerId}/conversation`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [newNote, setNewNote] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  const selectedTicket = useMemo(() => (ticketsData?.items || []).find((t) => t.id === selectedTicketId), [ticketsData, selectedTicketId]);

  const { data: ticketMessages, mutate: mutateTicketMessages } = useSWR<{ items: TicketMessage[] }>(
    selectedTicketId ? `/api/admin/sellers/${sellerId}/tickets/${selectedTicketId}/messages` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [ticketReply, setTicketReply] = useState('');
  const [conversationText, setConversationText] = useState('');

  const submitNote = async () => {
    const body = newNote.trim();
    if (!body) return;

    const res = await fetch(`/api/admin/sellers/${sellerId}/notes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut salva notița');
      return;
    }

    setNewNote('');
    await mutateNotes();
    toast.success('Notiță salvată');
  };

  const createTicket = async () => {
    const title = ticketTitle.trim();
    if (!title) return;

    const res = await fetch(`/api/admin/sellers/${sellerId}/tickets`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: ticketDesc.trim() || null, priority: ticketPriority }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut crea tichetul');
      return;
    }

    setTicketTitle('');
    setTicketDesc('');
    setTicketPriority('normal');
    await mutateTickets();
    toast.success('Tichet creat');
  };

  const sendTicketMessage = async () => {
    const body = ticketReply.trim();
    if (!selectedTicketId || !body) return;

    const res = await fetch(`/api/admin/sellers/${sellerId}/tickets/${selectedTicketId}/messages`, {
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

  const updateTicket = async (updates: Partial<Pick<Ticket, 'status' | 'priority'>>) => {
    if (!selectedTicketId) return;

    const res = await fetch(`/api/admin/sellers/${sellerId}/tickets/${selectedTicketId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast.error(payload?.error || 'Nu am putut actualiza tichetul');
      return;
    }

    await mutateTickets();
  };

  const sendConversationMessage = async () => {
    const body = conversationText.trim();
    if (!body) return;

    const res = await fetch(`/api/admin/sellers/${sellerId}/conversation`, {
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

  if (error) {
    return (
      <AdminPageWrapper title="Seller" description="Eroare la încărcare" showBackButton>
        <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div>
      </AdminPageWrapper>
    );
  }

  const seller = data?.seller;
  const stats = data?.stats;

  return (
    <AdminPageWrapper
      title={seller ? seller.brandName : 'Seller'}
      description={seller ? `/${seller.slug}` : ''}
      customBreadcrumbLabel={seller?.brandName}
      showBackButton
      backButtonHref="/admin/sellers"
    >
      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Overview</CardTitle>
            {seller && <div className="text-sm text-slate-600 dark:text-slate-300">{seller.user.email || '—'}</div>}
          </div>
          {seller && <Badge variant={statusVariant(seller.status) as any}>{seller.status}</Badge>}
        </CardHeader>
        <CardContent>
          {isLoading || !seller || !stats ? (
            <div className="text-sm text-slate-500">Se încarcă…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="text-xs text-slate-500">Comenzi</div>
                <div className="text-lg font-semibold">{stats.ordersCount}</div>
                <div className="text-xs text-slate-500">Ultima: {stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleString('ro-RO') : '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="text-xs text-slate-500">Vânzări (total)</div>
                <div className="text-lg font-semibold">{formatMoney(stats.revenueCents)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="text-xs text-slate-500">Produse</div>
                <div className="text-lg font-semibold">{stats.productsCount}</div>
                <div className="text-xs text-slate-500">Active: {stats.activeProductsCount}</div>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                  <div className="text-xs text-slate-500">Contact</div>
                  <div className="text-sm">Email seller: {seller.email || '—'}</div>
                  <div className="text-sm">Telefon: {seller.phone || '—'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                  <div className="text-xs text-slate-500">Legal</div>
                  <div className="text-sm">Denumire: {seller.legalName || '—'}</div>
                  <div className="text-sm">CUI: {seller.cui || '—'}</div>
                  <div className="text-sm">IBAN: {seller.iban || '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Reîncarcă overview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="text-xl">Notițe interne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Adaugă o notiță (vizibilă doar admin/support)…" rows={4} />
            <Button onClick={submitNote} disabled={!newNote.trim()}>
              Salvează notița
            </Button>

            <div className="space-y-3">
              {(notesData?.items || []).map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {n.author?.email || n.author?.name || '—'} • {new Date(n.createdAt).toLocaleString('ro-RO')}
                    </div>
                    <Badge variant="secondary">{n.author?.role || '—'}</Badge>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">{n.body}</div>
                </div>
              ))}
              {notesData && (notesData.items || []).length === 0 && (
                <div className="text-sm text-slate-500">Nicio notiță încă.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="text-xl">Tichete suport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <div className="text-sm font-medium">Creează tichet</div>
              <Input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Titlu" />
              <Textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} placeholder="Descriere (opțional)" rows={3} />
              <div className="flex gap-3 items-center">
                <div className="w-48">
                  <Select value={ticketPriority} onValueChange={(v) => setTicketPriority(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioritate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTicket} disabled={!ticketTitle.trim()}>
                  Creează
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {(ticketsData?.items || []).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left rounded-xl border p-3 transition ${selectedTicketId === t.id ? 'border-brand' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t.priority}</Badge>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Updated: {new Date(t.updatedAt).toLocaleString('ro-RO')}</div>
                </button>
              ))}
              {ticketsData && (ticketsData.items || []).length === 0 && (
                <div className="text-sm text-slate-500">Niciun tichet încă.</div>
              )}
            </div>

            {selectedTicket && (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{selectedTicket.title}</div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(v) => updateTicket({ priority: v as any })}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">low</SelectItem>
                        <SelectItem value="normal">normal</SelectItem>
                        <SelectItem value="high">high</SelectItem>
                        <SelectItem value="urgent">urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => updateTicket({ status: v as any })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">open</SelectItem>
                        <SelectItem value="in_progress">in_progress</SelectItem>
                        <SelectItem value="waiting_on_seller">waiting_on_seller</SelectItem>
                        <SelectItem value="resolved">resolved</SelectItem>
                        <SelectItem value="closed">closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  {(ticketMessages?.items || []).map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                      <div className="text-xs text-slate-500">{m.author?.email || m.author?.name || '—'} • {new Date(m.createdAt).toLocaleString('ro-RO')}</div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                  {ticketMessages && (ticketMessages.items || []).length === 0 && (
                    <div className="text-sm text-slate-500">Niciun mesaj încă.</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Răspunde…" rows={3} />
                  <Button onClick={sendTicketMessage} disabled={!ticketReply.trim()}>
                    Trimite mesaj
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Conversație 1:1 (support ↔ seller)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
            {(convoData?.messages || []).map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">{m.author?.email || m.author?.name || '—'} • {new Date(m.createdAt).toLocaleString('ro-RO')}</div>
                  <Badge variant="secondary">{m.authorRole}</Badge>
                </div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
            {convoData && (convoData.messages || []).length === 0 && (
              <div className="text-sm text-slate-500">Niciun mesaj încă.</div>
            )}
          </div>

          <div className="space-y-2">
            <Textarea value={conversationText} onChange={(e) => setConversationText(e.target.value)} placeholder="Scrie un mesaj…" rows={3} />
            <Button onClick={sendConversationMessage} disabled={!conversationText.trim()}>
              Trimite
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
