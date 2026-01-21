'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MarkdownEditor from '@/components/seller/MarkdownEditor';

type ContentVersion = {
  id: string;
  version: number;
  status: 'draft' | 'published' | string;
  createdAt: string;
  publishedAt?: string | null;
  meta?: any;
};

type ContentPayload = {
  seller: { id: string; slug: string; brandName: string };
  current: {
    aboutMd: string;
    seoTitle?: string | null;
    seoDesc?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
  };
  draft?: {
    id: string;
    version: number;
    aboutMd?: string | null;
    seoTitle?: string | null;
    seoDesc?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    createdAt: string;
  } | null;
  versions: ContentVersion[];
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

export default function AdminSellerContentPage() {
  const params = useParams<{ id: string }>();
  const sellerIdentifier = params.id;

  const { data, error, isLoading, mutate } = useSWR<ContentPayload>(
    sellerIdentifier ? `/api/admin/sellers/${sellerIdentifier}/content` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [lastDraftId, setLastDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.current) return;
    setLogoUrl(data.current.logoUrl || '');
    setBannerUrl(data.current.bannerUrl || '');
    setLastDraftId(data.draft?.id || null);
  }, [data?.seller?.id]);

  const initialEditor = useMemo(() => {
    const base = data?.draft || data?.current;
    return {
      content: (base as any)?.aboutMd || '',
      seoTitle: (base as any)?.seoTitle || '',
      seoDescription: (base as any)?.seoDesc || '',
    };
  }, [data?.draft?.id, data?.current?.aboutMd]);

  const saveDraft = async (payload: { content: string; seoTitle: string; seoDescription: string }) => {
    const message = window.prompt('Motiv/audit (opțional):', '') || undefined;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/content`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aboutMd: payload.content,
        seoTitle: payload.seoTitle || null,
        seoDesc: payload.seoDescription || null,
        logoUrl: logoUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        message: message?.trim() || undefined,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error || 'Nu am putut salva draft-ul');
      return;
    }

    toast.success('Draft salvat');
    setLastDraftId(body?.draft?.id || null);
    await mutate();
  };

  const publish = async () => {
    const versionId = lastDraftId || data?.draft?.id;
    const message = window.prompt('Motiv/audit pentru publish (opțional):', '') || undefined;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/content/publish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, message: message?.trim() || undefined }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error || 'Nu am putut publica');
      return;
    }

    toast.success('Publicat');
    await mutate();
  };

  const rollback = async (versionId: string, version: number) => {
    const message = window.prompt(`Motiv pentru rollback la v${version} (min 10):`, '') || '';
    if (message.trim().length < 10) return;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/content/rollback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, message: message.trim() }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error || 'Nu am putut face rollback');
      return;
    }

    toast.success('Rollback aplicat');
    await mutate();
  };

  const seller = data?.seller;

  return (
    <AdminPageWrapper
      title={seller ? `Content: ${seller.brandName}` : 'Content'}
      description={seller ? `/${seller.slug}` : ''}
      showBackButton
      backButtonHref={`/admin/sellers/${sellerIdentifier}`}
    >
      {error ? <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div> : null}

      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Pagina seller</CardTitle>
          {seller ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/s/${seller.slug}`} target="_blank">
                Preview public
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !data ? (
            <div className="text-sm text-slate-500">Se încarcă…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Logo URL</div>
                  <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Banner URL</div>
                  <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="primary" onClick={publish}>
                  Publish (din draft)
                </Button>
                <Badge variant="secondary">
                  <span>{data.draft ? `Draft v${data.draft.version}` : 'Fără draft'}</span>
                </Badge>
              </div>

              <MarkdownEditor
                initialContent={initialEditor.content}
                initialSeoTitle={initialEditor.seoTitle}
                initialSeoDescription={initialEditor.seoDescription}
                onSave={saveDraft}
                onCancel={() => toast('Nimic de anulat (draft doar la save).')}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Versiuni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.versions?.length ? (
            data.versions.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <div>
                  <div className="font-medium">v{v.version} • {v.status}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(v.createdAt).toLocaleString('ro-RO')}
                    {v.publishedAt ? ` • publicat: ${new Date(v.publishedAt).toLocaleString('ro-RO')}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => rollback(v.id, v.version)}>
                    Rollback
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">Nu există versiuni încă.</div>
          )}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
