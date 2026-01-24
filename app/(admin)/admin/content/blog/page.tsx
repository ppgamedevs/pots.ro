'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BlogPostRow = {
  id: string;
  slug: string;
  slugLocked: boolean;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived' | string;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string | null;
  authorName: string | null;
  authorSlug: string | null;
};

type ListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: BlogPostRow[];
};

async function fetcher(url: string): Promise<ListResponse> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

export default function AdminBlogPostsPage() {
  const router = useRouter();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'scheduled' | 'archived'>('all');

  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'all') params.set('status', status);
    params.set('page', '1');
    params.set('pageSize', '50');
    return `/api/admin/content/blog/posts?${params.toString()}`;
  }, [q, status]);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  const createPost = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const res = await fetch('/api/admin/content/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to create');

      toast.success('Post created');
      setNewTitle('');
      mutate();
      if (payload?.id) router.push(`/admin/content/blog/${payload.id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminPageWrapper title="Blog Posts">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-2">
            <Input placeholder="New post title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Button onClick={createPost} disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Posts</CardTitle>
            <div className="flex gap-2 items-center">
              <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-[220px]" />
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => mutate()}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error.message}</div>
            ) : !data?.items?.length ? (
              <div className="text-sm text-muted-foreground">No posts.</div>
            ) : (
              <div className="space-y-2">
                {data.items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/content/blog/${p.id}`}
                    className="block border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          /blog/{p.slug} • {p.status}
                          {p.authorName ? ` • ${p.authorName}` : ''}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleString('ro-RO') : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
