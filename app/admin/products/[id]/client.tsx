"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = { id: string; name: string; slug: string; parentId: string | null; position: number };

type ProductDetailResponse = {
  actorRole: "admin" | "support";
  product: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    priceCents: number;
    currency: string;
    stock: number;
    status: string;
    featured: boolean;
    seoTitle: string | null;
    seoDesc: string | null;
    seller: { id: string; slug: string; brandName: string };
    category: { id: string; name: string; slug: string } | null;
    createdAt: string;
    updatedAt: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    position: number | null;
    isPrimary: boolean;
    isHidden: boolean;
    isBlurred: boolean;
    moderationStatus: string;
    reportCount: number;
    moderatedAt: string | null;
    createdAt: string;
  }>;
  audit: Array<{
    id: string;
    actorId: string | null;
    actorRole: string | null;
    action: string;
    message: string | null;
    meta: any;
    createdAt: string;
  }>;
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || "Request failed");
  return payload;
}

function formatLeiFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function parseLeiToCents(input: string) {
  const cleaned = input.replace(/,/g, ".").trim();
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export default function AdminProductDetailClient({ id }: { id: string }) {
  const { data, error, mutate, isLoading } = useSWR<ProductDetailResponse>(
    `/api/admin/products/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: catsData } = useSWR<{ items: Category[] }>("/api/admin/categories", fetcher, {
    revalidateOnFocus: false,
  });

  const categories = useMemo(() => catsData?.items || [], [catsData?.items]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("__none__");
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState<string>("");
  const [seoDesc, setSeoDesc] = useState<string>("");
  const [priceLei, setPriceLei] = useState<string>("");
  const [stock, setStock] = useState<string>("");

  useEffect(() => {
    if (!data?.product) return;
    setTitle(data.product.title || "");
    setDescription(data.product.description || "");
    setCategoryId(data.product.categoryId || "__none__");
    setFeatured(Boolean(data.product.featured));
    setSeoTitle(data.product.seoTitle || "");
    setSeoDesc(data.product.seoDesc || "");
    setPriceLei(formatLeiFromCents(data.product.priceCents));
    setStock(String(data.product.stock ?? 0));
  }, [data?.product]);

  const canEditFinance = data?.actorRole === "admin";
  const canDeleteImages = data?.actorRole === "admin";

  const runImageAction = async (imageId: string, action: string) => {
    const res = await fetch(`/api/admin/product-images/${imageId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || "Acțiune eșuată");
      return;
    }

    toast.success("OK");
    await mutate();
  };

  const save = async () => {
    if (!data?.product) return;

    const body: any = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      categoryId: categoryId === "__none__" ? null : categoryId,
      featured,
      seoTitle: seoTitle.trim() ? seoTitle.trim() : null,
      seoDesc: seoDesc.trim() ? seoDesc.trim() : null,
    };

    if (canEditFinance) {
      const cents = parseLeiToCents(priceLei);
      if (cents === null) {
        toast.error("Preț invalid");
        return;
      }

      const stockInt = Number(stock);
      if (!Number.isInteger(stockInt) || stockInt < 0) {
        toast.error("Stoc invalid");
        return;
      }

      body.priceCents = cents;
      body.stock = stockInt;
    }

    const res = await fetch(`/api/admin/products/${id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || "Nu am putut salva");
      return;
    }

    toast.success("Salvat");
    await mutate();
  };

  if (isLoading) return <div className="text-sm text-slate-500">Se încarcă…</div>;
  if (error) return <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div>;
  if (!data?.product) return <div className="text-sm text-slate-500">Produs inexistent.</div>;

  return (
    <div className="space-y-6">
      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Detalii produs</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/p/${data.product.id}`} target="_blank">
                Vezi public
              </Link>
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Titlu</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Categorie</div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Alege" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(Fără categorie)</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} /{c.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Descriere</div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 p-3 md:col-span-2">
            <div>
              <div className="text-sm font-medium">Featured</div>
              <div className="text-xs text-slate-500">Apare în secțiuni promovate</div>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">SEO Title (override)</div>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="(opțional)" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">SEO Desc (override)</div>
            <Input value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="(opțional)" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Preț (RON)</div>
            <Input
              value={priceLei}
              onChange={(e) => setPriceLei(e.target.value)}
              disabled={!canEditFinance}
            />
            {!canEditFinance ? (
              <div className="text-xs text-slate-500">Doar admin poate modifica prețul.</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Stoc</div>
            <Input value={stock} onChange={(e) => setStock(e.target.value)} disabled={!canEditFinance} />
            {!canEditFinance ? (
              <div className="text-xs text-slate-500">Doar admin poate modifica stocul.</div>
            ) : null}
          </div>

          <div className="text-xs text-slate-500 md:col-span-2">
            Seller: {data.product.seller.brandName} • slug: {data.product.slug} • status: {data.product.status}
          </div>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Imagini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.images.map((img) => (
              <div key={img.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-2">
                <img
                  src={img.url}
                  alt={img.alt || data.product.title}
                  className="w-full h-32 object-cover rounded-lg"
                  loading="lazy"
                />
                <div className="mt-2 text-xs text-slate-500">
                  {img.isPrimary ? "primary" : ""} {img.moderationStatus} • reports: {img.reportCount}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => runImageAction(img.id, "set_primary")}
                    disabled={img.isPrimary}
                  >
                    Primary
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runImageAction(img.id, img.isHidden ? "unhide" : "hide")}
                  >
                    {img.isHidden ? "Unhide" : "Hide"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runImageAction(img.id, img.isBlurred ? "unblur" : "blur")}
                  >
                    {img.isBlurred ? "Unblur" : "Blur"}
                  </Button>
                  {canDeleteImages ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const ok = window.confirm("Ștergi imaginea? (ireversibil)");
                        if (ok) runImageAction(img.id, "delete");
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {!data.images.length ? <div className="text-sm text-slate-500">Nu are imagini.</div> : null}
          </div>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-xl">Istoric modificări (audit)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.audit.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString("ro-RO")} • {a.actorRole || "?"}
                  </div>
                </div>
                {a.message ? <div className="text-slate-700 dark:text-slate-300">{a.message}</div> : null}
                {a.meta ? (
                  <pre className="mt-2 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-lg p-2 overflow-auto">
                    {JSON.stringify(a.meta, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
            {!data.audit.length ? <div className="text-sm text-slate-500">Nimic încă.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
