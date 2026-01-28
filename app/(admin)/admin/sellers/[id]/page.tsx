
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type SellerOnboardingProgress = {
  sellerId: string;
  userId: string;
  brandName: string;
  email: string;
  sellerStatus: 'onboarding' | 'active' | 'suspended';
  currentStep: string;
  overallProgress: number;
  steps: Array<{
    step: string;
    status: string;
    label: string;
    description: string;
    requirements: Array<{
      id: string;
      label: string;
      completed: boolean;
      blockedReason?: string;
    }>;
    completedAt?: string;
  }>;
  canActivate: boolean;
  blockedReason?: string;
  lastUpdatedAt: string;
  createdAt: string;
};

type OnboardingApiResponse = {
  progress: SellerOnboardingProgress;
  documents: Array<{
    id: string;
    docType: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    createdAt: string | null;
    reviewedAt: string | null;
    reviewerEmail: string | null;
    reviewerName: string | null;
    reviewMessage: string | null;
  }>;
  showFullPii: boolean;
};

type SellerDetail = {
  seller: {
    id: string;
    slug: string;
    brandName: string;
    status: string;
    isPlatform?: boolean;
    phone?: string | null;
    email?: string | null;
    legalName?: string | null;
    cui?: string | null;
    iban?: string | null;
    about?: string | null;
    returnPolicy?: string | null;
    shippingPrefs?: any;
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

type SellerAction = {
  id: string;
  action: string;
  message?: string | null;
  meta?: any;
  createdAt: string;
  admin?: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
};

type ImpersonationStatus = {
  active: boolean;
  expiresAt?: string | null;
  seller?: { id: string; slug?: string; brandName?: string };
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
  const router = useRouter();
  const sellerIdentifier = params.id;

  // Temporar dezactivat (nu-l folosim curând). Lăsăm backend-ul pregătit pentru când îl reactivăm.
  const PLATFORM_TOGGLE_ENABLED = false;

  const looksLikeUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const { data, error, isLoading, mutate } = useSWR<SellerDetail>(`/api/admin/sellers/${sellerIdentifier}`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: notesData, mutate: mutateNotes } = useSWR<{ items: Note[] }>(
    `/api/admin/sellers/${sellerIdentifier}/notes`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: ticketsData, mutate: mutateTickets } = useSWR<{ items: Ticket[] }>(
    `/api/admin/sellers/${sellerIdentifier}/tickets`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: convoData, mutate: mutateConvo } = useSWR<ConversationPayload>(
    `/api/admin/sellers/${sellerIdentifier}/conversation`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: actionsData, mutate: mutateActions } = useSWR<{ items: SellerAction[] }>(
    `/api/admin/sellers/${sellerIdentifier}/actions`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: impersonationData, mutate: mutateImpersonation } = useSWR<ImpersonationStatus>(
    `/api/admin/impersonation`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: onboardingData, mutate: mutateOnboarding } = useSWR<OnboardingApiResponse>(
    data?.seller?.status === 'onboarding' ? `/api/admin/sellers/${sellerIdentifier}/onboarding` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [newNote, setNewNote] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAuditMessage, setProfileAuditMessage] = useState('');
  const [isPlatformDraft, setIsPlatformDraft] = useState(false);
  const [returnPolicyDraft, setReturnPolicyDraft] = useState('');
  const [shippingPrefsDraft, setShippingPrefsDraft] = useState('');

  const [resetOnboardingLoading, setResetOnboardingLoading] = useState(false);
  const [resetOnboardingMessage, setResetOnboardingMessage] = useState('');

  const [activateSellerLoading, setActivateSellerLoading] = useState(false);
  const [documentReviewLoading, setDocumentReviewLoading] = useState<string | null>(null);

  const [impersonationMessage, setImpersonationMessage] = useState('');
  const [impersonationLoading, setImpersonationLoading] = useState(false);

  const selectedTicket = useMemo(() => (ticketsData?.items || []).find((t) => t.id === selectedTicketId), [ticketsData, selectedTicketId]);

  const { data: ticketMessages, mutate: mutateTicketMessages } = useSWR<{ items: TicketMessage[] }>(
    selectedTicketId ? `/api/admin/sellers/${sellerIdentifier}/tickets/${selectedTicketId}/messages` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [ticketReply, setTicketReply] = useState('');
  const [conversationText, setConversationText] = useState('');

  const submitNote = async () => {
    const body = newNote.trim();
    if (!body) return;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/notes`, {
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

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/tickets`, {
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

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/tickets/${selectedTicketId}/messages`, {
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

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/tickets/${selectedTicketId}`, {
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

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/conversation`, {
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

  const handleSuspendReactivate = async () => {
    if (!seller) return;
    if (statusMessage.trim().length < 10) return;

    try {
      setStatusLoading(true);
      const action = seller.status === 'suspended' ? 'reactivate' : 'suspend';

      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, message: statusMessage.trim() }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut actualiza statusul sellerului');
        return;
      }

      toast.success(action === 'suspend' ? 'Seller suspendat' : 'Seller reactivat');
      setStatusMessage('');
      await mutate();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setStatusLoading(false);
    }
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

  useEffect(() => {
    if (!seller) return;
    setIsPlatformDraft(!!seller.isPlatform);
    setReturnPolicyDraft(seller.returnPolicy || '');
    try {
      setShippingPrefsDraft(
        seller.shippingPrefs ? JSON.stringify(seller.shippingPrefs, null, 2) : ''
      );
    } catch {
      setShippingPrefsDraft('');
    }
  }, [seller?.id]);

  const saveProfile = async () => {
    if (!seller) return;
    try {
      setProfileSaving(true);

      let shippingPrefs: any = undefined;
      if (shippingPrefsDraft.trim()) {
        try {
          shippingPrefs = JSON.parse(shippingPrefsDraft);
        } catch {
          toast.error('shippingPrefs trebuie să fie JSON valid');
          return;
        }
      } else {
        shippingPrefs = null;
      }

      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(PLATFORM_TOGGLE_ENABLED ? { isPlatform: isPlatformDraft } : {}),
          returnPolicy: returnPolicyDraft.trim() || null,
          shippingPrefs,
          auditMessage: profileAuditMessage.trim() || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut salva');
        return;
      }

      toast.success('Salvat');
      setProfileAuditMessage('');
      await mutate();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setProfileSaving(false);
    }
  };

  const resetOnboarding = async () => {
    if (!seller) return;
    if (resetOnboardingMessage.trim().length < 10) return;
    if (!window.confirm('Sigur vrei să resetezi sellerul în onboarding?')) return;

    try {
      setResetOnboardingLoading(true);
      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/reset-onboarding`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: resetOnboardingMessage.trim() }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut reseta onboarding');
        return;
      }
      toast.success('Reset onboarding');
      setResetOnboardingMessage('');
      await mutate();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setResetOnboardingLoading(false);
    }
  };

  const reviewDocument = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    if (!seller) return;
    try {
      setDocumentReviewLoading(documentId);
      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/documents/${documentId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut procesa documentul');
        return;
      }

      toast.success(action === 'approve' ? 'Document aprobat' : 'Document respins');
      await mutateOnboarding();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setDocumentReviewLoading(null);
    }
  };

  const activateSeller = async () => {
    if (!seller) return;
    if (!window.confirm('Sigur vrei să activezi acest seller?')) return;

    try {
      setActivateSellerLoading(true);
      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/activate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut activa sellerul');
        return;
      }

      toast.success('Seller activat!');
      await mutate();
      await mutateOnboarding();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setActivateSellerLoading(false);
    }
  };

  const startImpersonation = async () => {
    if (!seller) return;
    if (impersonationMessage.trim().length < 10) return;

    try {
      setImpersonationLoading(true);
      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/impersonation`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: impersonationMessage.trim(), ttlMinutes: 15 }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut porni impersonarea');
        return;
      }

      toast.success('Impersonare pornită (read-only)');
      setImpersonationMessage('');
      await mutateImpersonation();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setImpersonationLoading(false);
    }
  };

  const stopImpersonation = async () => {
    if (!seller) return;
    try {
      setImpersonationLoading(true);
      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/impersonation`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut opri impersonarea');
        return;
      }
      toast.success('Impersonare oprită');
      await mutateImpersonation();
      await mutateActions();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setImpersonationLoading(false);
    }
  };

  useEffect(() => {
    if (!seller?.slug) return;
    if (!looksLikeUuid(sellerIdentifier)) return;
    if (sellerIdentifier === seller.slug) return;
    router.replace(`/admin/sellers/${seller.slug}`);
  }, [router, seller?.slug, sellerIdentifier]);

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
          {seller ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/sellers/${seller.slug}/compliance`}>Compliance</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/sellers/${seller.slug}/content`}>Content</Link>
              </Button>
              <Badge variant={statusVariant(seller.status) as any}>{seller.status}</Badge>
            </div>
          ) : null}
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

                <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                  <div className="text-xs text-slate-500">Profil seller</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">isPlatform</div>
                    <div
                      className="flex items-center gap-2 opacity-60"
                      title={PLATFORM_TOGGLE_ENABLED ? undefined : 'Dezactivat temporar'}
                    >
                      <Switch
                        checked={isPlatformDraft}
                        disabled={!PLATFORM_TOGGLE_ENABLED}
                        onCheckedChange={(checked) => {
                          if (!PLATFORM_TOGGLE_ENABLED) return;
                          setIsPlatformDraft(checked);
                        }}
                      />
                      <span className="text-xs text-slate-500">
                        {isPlatformDraft ? 'Da' : 'Nu'}
                        {!PLATFORM_TOGGLE_ENABLED ? ' (dezactivat)' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Return policy</div>
                    <Textarea
                      value={returnPolicyDraft}
                      onChange={(e) => setReturnPolicyDraft(e.target.value)}
                      rows={4}
                      placeholder="Politica de retur..."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Shipping prefs (JSON)</div>
                    <Textarea
                      value={shippingPrefsDraft}
                      onChange={(e) => setShippingPrefsDraft(e.target.value)}
                      rows={6}
                      placeholder='{"carrier":"..."}'
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Audit mesaj (opțional)</div>
                    <Input
                      value={profileAuditMessage}
                      onChange={(e) => setProfileAuditMessage(e.target.value)}
                      placeholder="De ce ai schimbat profilul?"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveProfile} disabled={profileSaving || !seller}>
                      {profileSaving ? 'Se salvează…' : 'Salvează profil'}
                    </Button>
                    <Button variant="outline" onClick={() => mutateActions()}>
                      Reîncarcă audit
                    </Button>
                  </div>
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

      {/* Onboarding Progress - Only show for sellers in onboarding status */}
      {seller?.status === 'onboarding' && (
        <Card hover={false} className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="text-amber-600">⏳</span> Onboarding în progres
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Acest seller trebuie să completeze procesul de înregistrare
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onboardingData?.progress?.canActivate && (
                <Button
                  onClick={activateSeller}
                  disabled={activateSellerLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {activateSellerLoading ? 'Se activează...' : '✓ Activează seller'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => mutateOnboarding()}>
                Reîncarcă
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!onboardingData ? (
              <div className="text-sm text-slate-500">Se încarcă progresul...</div>
            ) : (
              <div className="space-y-6">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progres total</span>
                    <span className="text-sm text-slate-600">{onboardingData.progress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${onboardingData.progress.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Blocked reason */}
                {onboardingData.progress.blockedReason && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600">⚠️</span>
                      <div>
                        <div className="font-medium text-red-900 dark:text-red-100">Blocat</div>
                        <div className="text-sm text-red-700 dark:text-red-300">{onboardingData.progress.blockedReason}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-4">
                  {onboardingData.progress.steps.map((step) => (
                    <div key={step.step} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {step.status === 'completed' && <span className="text-green-600">✓</span>}
                          {step.status === 'in_progress' && <span className="text-amber-600">⏳</span>}
                          {step.status === 'not_started' && <span className="text-slate-400">○</span>}
                          {step.status === 'blocked' && <span className="text-red-600">⚠</span>}
                          <span className="font-medium">{step.label}</span>
                        </div>
                        <Badge variant={
                          step.status === 'completed' ? 'success' as any :
                          step.status === 'in_progress' ? 'warning' as any :
                          step.status === 'blocked' ? 'destructive' :
                          'secondary'
                        }>
                          {step.status === 'completed' ? 'Completat' :
                           step.status === 'in_progress' ? 'În progres' :
                           step.status === 'blocked' ? 'Blocat' : 'Nepornit'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{step.description}</p>
                      <div className="space-y-1">
                        {step.requirements.map((req) => (
                          <div key={req.id} className="flex items-center gap-2 text-sm">
                            {req.completed ? (
                              <span className="text-green-600 text-xs">✓</span>
                            ) : (
                              <span className="text-slate-400 text-xs">○</span>
                            )}
                            <span className={req.completed ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                              {req.label}
                            </span>
                            {req.blockedReason && !req.completed && (
                              <span className="text-xs text-amber-600">({req.blockedReason})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Documents */}
                {onboardingData.documents.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Documente încărcate</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onboardingData.documents.filter(d => d.status !== 'superseded').map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{doc.filename}</div>
                              <div className="text-xs text-slate-500">{doc.docType}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                Încărcat: {doc.createdAt ? new Date(doc.createdAt).toLocaleString('ro-RO') : '—'}
                              </div>
                              {doc.reviewedAt && (doc.reviewerName || doc.reviewerEmail) && (
                                <div className="text-xs text-slate-500">
                                  Verificat de {doc.reviewerName || doc.reviewerEmail} la {new Date(doc.reviewedAt).toLocaleString('ro-RO')}
                                </div>
                              )}
                              {doc.reviewMessage && (
                                <div className="text-xs text-red-600 mt-1">Motiv: {doc.reviewMessage}</div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={
                                doc.status === 'approved' ? 'success' as any :
                                doc.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {doc.status === 'approved' ? 'Aprobat' :
                                 doc.status === 'rejected' ? 'Respins' : 'În așteptare'}
                              </Badge>
                            </div>
                          </div>
                          {doc.status === 'uploaded' && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => reviewDocument(doc.id, 'approve')}
                                disabled={documentReviewLoading === doc.id}
                              >
                                {documentReviewLoading === doc.id ? '...' : '✓ Aprobă'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  const reason = prompt('Motiv respingere:');
                                  if (reason) reviewDocument(doc.id, 'reject', reason);
                                }}
                                disabled={documentReviewLoading === doc.id}
                              >
                                ✕ Respinge
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline info */}
                <div className="text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div>Seller creat: {new Date(onboardingData.progress.createdAt).toLocaleString('ro-RO')}</div>
                  <div>Ultima actualizare: {new Date(onboardingData.progress.lastUpdatedAt).toLocaleString('ro-RO')}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suspend/Reactivate Seller */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Acțiuni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div>
              <div className="text-sm font-medium mb-2">Status curent</div>
              <Badge variant={statusVariant(seller?.status) as any}>
                {seller?.status || '—'}
              </Badge>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Acțiune</div>
              <Select value={seller?.status === 'suspended' ? 'reactivate' : 'suspend'} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seller?.status !== 'suspended' && <SelectItem value="suspend">Suspendă</SelectItem>}
                  {seller?.status === 'suspended' && <SelectItem value="reactivate">Reactivează</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <div className="text-sm font-medium mb-2">
                Mesaj <span className="text-red-500">*</span>
              </div>
              <Textarea
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="Mesaj pentru acțiune (minimum 10 caractere)..."
                rows={3}
                className={
                  statusMessage.length > 0 && statusMessage.trim().length < 10
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
              />
              {statusMessage.length > 0 && statusMessage.trim().length < 10 && (
                <p className="mt-1 text-sm text-red-500">Mesajul trebuie să aibă minimum 10 caractere</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSuspendReactivate}
            disabled={statusLoading || statusMessage.trim().length < 10 || !seller}
            className={
              `w-full ${seller?.status === 'suspended'
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400 disabled:cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed'}`
            }
          >
            {statusLoading
              ? 'Procesare...'
              : seller?.status === 'suspended'
              ? 'Reactivează'
              : 'Suspendă'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="text-xl">Reset onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Setează statusul sellerului la <strong>onboarding</strong> și înregistrează acțiunea în audit.
            </div>
            <div>
              <div className="text-sm font-medium mb-2">
                Mesaj <span className="text-red-500">*</span>
              </div>
              <Textarea
                value={resetOnboardingMessage}
                onChange={(e) => setResetOnboardingMessage(e.target.value)}
                rows={3}
                placeholder="Motiv reset onboarding (minimum 10 caractere)..."
                className={
                  resetOnboardingMessage.length > 0 && resetOnboardingMessage.trim().length < 10
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
              />
              {resetOnboardingMessage.length > 0 && resetOnboardingMessage.trim().length < 10 && (
                <p className="mt-1 text-sm text-red-500">Mesajul trebuie să aibă minimum 10 caractere</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={resetOnboarding}
              disabled={resetOnboardingLoading || resetOnboardingMessage.trim().length < 10 || !seller}
            >
              {resetOnboardingLoading ? 'Procesare…' : 'Reset onboarding'}
            </Button>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="text-xl">Impersonare (read-only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Creează o sesiune temporară de impersonare (15 minute) pentru a vedea UI-ul de seller.
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">Status</div>
                <Badge variant={impersonationData?.active ? ('success' as any) : ('secondary' as any)}>
                  {impersonationData?.active ? 'Activ' : 'Inactiv'}
                </Badge>
              </div>
              {impersonationData?.active && impersonationData?.expiresAt ? (
                <div className="mt-2 text-xs text-slate-500">
                  Expiră: {new Date(impersonationData.expiresAt).toLocaleString('ro-RO')}
                </div>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">
                Mesaj <span className="text-red-500">*</span>
              </div>
              <Input
                value={impersonationMessage}
                onChange={(e) => setImpersonationMessage(e.target.value)}
                placeholder="Motiv impersonare (minimum 10 caractere)..."
              />
              {impersonationMessage.length > 0 && impersonationMessage.trim().length < 10 ? (
                <p className="mt-1 text-sm text-red-500">Mesajul trebuie să aibă minimum 10 caractere</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={startImpersonation}
                disabled={impersonationLoading || impersonationMessage.trim().length < 10 || !seller}
              >
                {impersonationLoading ? 'Procesare…' : 'Pornește (15 min)'}
              </Button>
              <Button variant="outline" onClick={stopImpersonation} disabled={impersonationLoading || !seller}>
                Oprește
              </Button>
              <Button asChild variant="primary" disabled={!impersonationData?.active}>
                <a href="/seller/orders" target="_blank" rel="noreferrer">Deschide seller UI</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-xl">Audit acțiuni</CardTitle>
            <Button variant="outline" size="sm" onClick={() => mutateActions()}>
              Reîncarcă
            </Button>
          </CardHeader>
          <CardContent>
            {(actionsData?.items || []).length === 0 ? (
              <div className="text-sm text-slate-500">Nu există acțiuni înregistrate.</div>
            ) : (
              <div className="space-y-3">
                {(actionsData?.items || []).slice(0, 25).map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{a.action}</div>
                      <div className="text-xs text-slate-500">
                        {a.createdAt ? new Date(a.createdAt).toLocaleString('ro-RO') : '—'}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {a.admin?.email || a.admin?.name || '—'}
                    </div>
                    {a.message ? (
                      <div className="mt-2 text-sm whitespace-pre-wrap">{a.message}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ... rest of page ... */}
      </div>

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
