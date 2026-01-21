'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type KycDoc = {
  id: string;
  docType: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: 'uploaded' | 'approved' | 'rejected' | 'superseded' | string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewMessage?: string | null;
};

type KycPayload = {
  seller: {
    id: string;
    slug: string;
    brandName: string;
    cui?: string | null;
    iban?: string | null;
    verifiedBadge: boolean;
    cuiValidatedAt?: string | null;
    ibanValidatedAt?: string | null;
    kycReverificationRequestedAt?: string | null;
  };
  verification: {
    cuiValidated: boolean;
    ibanValidated: boolean;
    verifiedBadge: boolean;
    reverifyRequested: boolean;
  };
  documents: KycDoc[];
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

function statusBadgeVariant(status: string) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'destructive';
  if (status === 'uploaded') return 'secondary';
  return 'secondary';
}

export default function AdminSellerCompliancePage() {
  const params = useParams<{ id: string }>();
  const sellerIdentifier = params.id;

  const { data, error, isLoading, mutate } = useSWR<KycPayload>(
    sellerIdentifier ? `/api/admin/sellers/${sellerIdentifier}/kyc` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [docType, setDocType] = useState<string>('company_registration');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    const message = window.prompt('Motiv/audit pentru upload doc (opțional):', '') || undefined;

    try {
      setUploading(true);
      const form = new FormData();
      form.set('docType', docType);
      form.set('file', file);
      if (message?.trim()) form.set('message', message.trim());

      const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/kyc/documents`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error || 'Nu am putut încărca documentul');
        return;
      }

      toast.success('Document încărcat');
      setFile(null);
      await mutate();
    } catch (err) {
      console.error(err);
      toast.error('Eroare de rețea');
    } finally {
      setUploading(false);
    }
  };

  const setFlags = async (flags: Partial<{ verifiedBadge: boolean; cuiValidated: boolean; ibanValidated: boolean }>) => {
    const message = window.prompt('Motiv/audit (min 10 caractere):', '') || '';
    if (message.trim().length < 10) return;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/kyc`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_flags', message: message.trim(), flags }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut actualiza');
      return;
    }
    toast.success('Actualizat');
    await mutate();
  };

  const requestReverify = async () => {
    const message = window.prompt('Motiv pentru re-verificare (min 10 caractere):', '') || '';
    if (message.trim().length < 10) return;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/kyc`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_reverification', message: message.trim() }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut cere re-verificarea');
      return;
    }

    toast.success('Re-verificare cerută');
    await mutate();
  };

  const reviewDoc = async (doc: KycDoc, status: 'approved' | 'rejected') => {
    const message = window.prompt(`Mesaj (opțional) pentru ${status}:`, '') || undefined;

    const res = await fetch(`/api/admin/sellers/${sellerIdentifier}/kyc/documents/${doc.id}/review`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, message }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut actualiza documentul');
      return;
    }

    toast.success(status === 'approved' ? 'Aprobat' : 'Respins');
    await mutate();
  };

  const seller = data?.seller;

  return (
    <AdminPageWrapper
      title={seller ? `Compliance: ${seller.brandName}` : 'Compliance'}
      description={seller ? `/${seller.slug}` : ''}
      showBackButton
      backButtonHref={`/admin/sellers/${sellerIdentifier}`}
    >
      {error ? <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div> : null}

      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Stare verificare</CardTitle>
          {seller ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/s/${seller.slug}`} target="_blank">
                Vezi pagina publică
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading || !seller ? (
            <div className="text-sm text-slate-500">Se încarcă…</div>
          ) : (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={data?.verification.cuiValidated ? 'success' : 'secondary'}>
                  <span>CUI {data?.verification.cuiValidated ? 'validat' : 'nevalidat'}</span>
                </Badge>
                <Badge variant={data?.verification.ibanValidated ? 'success' : 'secondary'}>
                  <span>IBAN {data?.verification.ibanValidated ? 'validat' : 'nevalidat'}</span>
                </Badge>
                <Badge variant={data?.verification.verifiedBadge ? 'success' : 'secondary'}>
                  <span>Verified badge {data?.verification.verifiedBadge ? 'DA' : 'NU'}</span>
                </Badge>
                {data?.verification.reverifyRequested ? (
                  <Badge variant="destructive">
                    <span>Re-verificare cerută</span>
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setFlags({ cuiValidated: !data?.verification.cuiValidated })}>
                  Toggle CUI validat
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFlags({ ibanValidated: !data?.verification.ibanValidated })}>
                  Toggle IBAN validat
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFlags({ verifiedBadge: !data?.verification.verifiedBadge })}>
                  Toggle verified badge
                </Button>
                <Button variant="destructive" size="sm" onClick={requestReverify}>
                  Cere re-verificare
                </Button>
              </div>

              <div className="text-xs text-slate-500">
                Notă: documentele sunt stocate criptat în DB și se descarcă doar prin endpointuri autorizate.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Documente KYC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <div className="text-sm font-medium mb-1">Tip document</div>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Alege tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_registration">Company registration</SelectItem>
                  <SelectItem value="iban_proof">IBAN proof</SelectItem>
                  <SelectItem value="id_doc">ID document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Fișier</div>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Button onClick={upload} disabled={!file || uploading}>
                {uploading ? 'Se încarcă…' : 'Upload'}
              </Button>
            </div>
          </div>

          {data?.documents?.length ? (
            <div className="space-y-2">
              {data.documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{doc.filename}</div>
                    <div className="text-xs text-slate-500">
                      {doc.docType} • {doc.mimeType} • {(doc.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                    {doc.reviewMessage ? <div className="text-xs text-slate-600 mt-1">{doc.reviewMessage}</div> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(doc.status) as any}>{doc.status}</Badge>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/admin/sellers/${sellerIdentifier}/kyc/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => reviewDoc(doc, 'approved')}>
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => reviewDoc(doc, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Nu există documente încă.</div>
          )}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
