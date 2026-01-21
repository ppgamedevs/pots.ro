'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  slugLocked: boolean;
  position: number;
  productsCount: number;
};

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data, error, mutate, isLoading } = useSWR<{ items: CategoryRow[] }>(
    '/api/admin/categories',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [q, setQ] = useState('');

  const categories = useMemo(() => data?.items || [], [data?.items]);
  const parentOptions = useMemo(() => {
    const childrenByParent = new Map<string | null, CategoryRow[]>();
    for (const c of categories) {
      const key = c.parentId ?? null;
      const list = childrenByParent.get(key) ?? [];
      list.push(c);
      childrenByParent.set(key, list);
    }

    for (const [key, list] of childrenByParent.entries()) {
      list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name));
      childrenByParent.set(key, list);
    }

    const result: Array<{ id: string; label: string }> = [];
    const visit = (parentId: string | null, depth: number) => {
      const kids = childrenByParent.get(parentId) ?? [];
      for (const kid of kids) {
        const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : '';
        result.push({ id: kid.id, label: `${prefix}${kid.name}` });
        visit(kid.id, depth + 1);
      }
    };

    visit(null, 0);
    return result;
  }, [categories]);

  const [selectedParentId, setSelectedParentId] = useState<string>('__root__');

  const displayed = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? categories.filter((c) => c.name.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle))
      : categories;

    const parentId = selectedParentId === '__root__' ? null : selectedParentId;
    return filtered
      .filter((c) => (parentId === null ? !c.parentId : c.parentId === parentId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [categories, q, selectedParentId]);

  const [localOrder, setLocalOrder] = useState<CategoryRow[] | null>(null);
  const shown = localOrder ?? displayed;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = shown.findIndex((c) => c.id === active.id);
    const newIndex = shown.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setLocalOrder(arrayMove(shown, oldIndex, newIndex));
  };

  const saveOrder = async () => {
    const items = (localOrder ?? displayed).map((c, idx) => ({
      id: c.id,
      parentId: c.parentId,
      position: idx,
    }));

    const res = await fetch('/api/admin/categories/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut salva ordinea');
      return;
    }

    toast.success('Ordine salvată');
    setLocalOrder(null);
    await mutate();
  };

  const createCategory = async () => {
    const name = window.prompt('Nume categorie:', '')?.trim();
    if (!name) return;

    const slug = window
      .prompt('Slug (va fi LOCK):', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
      ?.trim();
    if (!slug) return;

    const parentId = selectedParentId === '__root__' ? null : selectedParentId;

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, parentId }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut crea categoria');
      return;
    }

    toast.success('Categorie creată');
    await mutate();
  };

  const renameCategory = async (cat: CategoryRow) => {
    const name = window.prompt('Nume nou:', cat.name)?.trim();
    if (!name || name === cat.name) return;

    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut salva');
      return;
    }

    toast.success('Salvat');
    await mutate();
  };

  const deleteCategory = async (cat: CategoryRow) => {
    const ok = window.confirm(`Ștergi categoria "${cat.name}"? (doar dacă nu are produse)`);
    if (!ok) return;

    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut șterge');
      return;
    }

    toast.success('Șters');
    await mutate();
  };

  const mergeCategory = async (from: CategoryRow) => {
    const toSlug = window.prompt('Slug destinație (categoria în care se face merge):', '')?.trim();
    if (!toSlug) return;

    const to = categories.find((c) => c.slug === toSlug);
    if (!to) {
      toast.error('Nu există categoria destinație cu acest slug');
      return;
    }

    const reason = window.prompt('Motiv (opțional):', `merge:${from.slug}->${to.slug}`)?.trim() || undefined;

    const res = await fetch('/api/admin/categories/merge', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCategoryId: from.id, toCategoryId: to.id, reason }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(payload?.error || 'Nu am putut face merge');
      return;
    }

    toast.success('Merge complet');
    await mutate();
  };

  return (
    <AdminPageWrapper title="Catalog: Categorii" description="CRUD + reorder + merge (slug lock + redirect)" showBackButton backButtonHref="/admin">
      {error ? <div className="text-sm text-red-600">Eroare: {String(error.message || error)}</div> : null}

      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Lista categorii</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
              Refresh
            </Button>
            <Button onClick={createCategory}>Create</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <div className="text-sm font-medium mb-1">Filtru părinte</div>
              <Select value={selectedParentId} onValueChange={(v) => {
                setSelectedParentId(v);
                setLocalOrder(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Alege" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">(Root)</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Caută</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="nume/slug" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocalOrder(null)} disabled={!localOrder}>
                Reset
              </Button>
              <Button onClick={saveOrder} disabled={!localOrder}>
                Save order
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">Se încarcă…</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={shown.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {shown.map((cat) => (
                    <SortableItem id={cat.id} key={cat.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-slate-900/40">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {cat.name} <span className="text-xs text-slate-500">/{cat.slug}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            produse: {cat.productsCount} • slug: {cat.slugLocked ? 'LOCK' : 'unlock'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => renameCategory(cat)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => mergeCategory(cat)}>
                            Merge
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCategory(cat)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                  {!shown.length ? <div className="text-sm text-slate-500">Nimic de afișat.</div> : null}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
