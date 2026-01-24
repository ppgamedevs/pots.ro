'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownEditor from '@/components/seller/MarkdownEditor';

type Post = {
  id: string;
  slug: string;
  slugLocked: boolean;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  bodyMd: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string | null;
  authorId: string | null;
  authorName: string | null;
  authorSlug: string | null;
};

type VersionRow = {
  id: string;
  version: number;
  status: string;
  createdAt: string | null;
  publishedAt: string | null;
  title: string;
};

type DetailResponse = { post: Post; versions: VersionRow[] };

async function fetcher(url: string): Promise<DetailResponse> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || 'Request failed');
  }
  return res.json();
}

export default function AdminBlogPostEditorPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const url = useMemo(() => `/api/admin/content/blog/posts/${id}`, [id]);
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const post = data?.post;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [initialEditor, setInitialEditor] = useState({ content: '', seoTitle: '', seoDescription: '' });

  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || '');
    setCoverUrl(post.coverUrl || '');
    setInitialEditor({
      content: post.bodyMd || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDesc || '',
    });
  }, [post?.id]);

  const save = async (dataToSave: { content: string; seoTitle: string; seoDescription: string }) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/content/blog/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          coverUrl: coverUrl || null,
          seoTitle: dataToSave.seoTitle || null,
          seoDesc: dataToSave.seoDescription || null,
          bodyMd: dataToSave.content || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to save');
      toast.success(`Saved (v${payload?.version ?? '?'})`);
      await mutate();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      setPublishing(true);
      const body = scheduledAt.trim() ? { scheduledAt: new Date(scheduledAt).toISOString() } : {};
      const res = await fetch(`/api/admin/content/blog/posts/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to publish');
      toast.success(`Published (${payload?.status})`);
      setScheduledAt('');
      await mutate();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    try {
      const res = await fetch(`/api/admin/content/blog/posts/${id}/unpublish`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to unpublish');
      toast.success('Unpublished');
      await mutate();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to unpublish');
    }
  };

  const rollback = async (version: number) => {
    try {
      const res = await fetch(`/api/admin/content/blog/posts/${id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ version }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to rollback');
      toast.success(`Rolled back (v${payload?.version ?? '?'})`);
      await mutate();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to rollback');
    }
  };

  return (
    <AdminPageWrapper title={post ? `Blog: ${post.title}` : 'Blog Post'}>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error.message}</div>
      ) : !post ? (
        <div className="text-sm text-muted-foreground">Not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => mutate()}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" />
                </div>
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Cover URL" />
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" />

                <MarkdownEditor
                  key={`${id}:${data?.versions?.[0]?.id || 'v'}`}
                  initialContent={initialEditor.content}
                  initialSeoTitle={initialEditor.seoTitle}
                  initialSeoDescription={initialEditor.seoDescription}
                  onSave={save}
                  onCancel={() => toast('Nothing to cancel (draft is created on save).')}
                  loading={saving}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground">Status: {post.status}</div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    placeholder="Schedule (optional) — e.g. 2026-01-30 10:00"
                  />
                  <Button onClick={publish} disabled={publishing}>
                    {publishing ? 'Publishing…' : 'Publish'}
                  </Button>
                  <Button variant="outline" onClick={unpublish}>
                    Unpublish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.versions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No versions.</div>
                ) : (
                  data.versions.map((v) => (
                    <div key={v.id} className="border rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">v{v.version}</div>
                        <div className="text-xs text-muted-foreground">{v.status}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{v.createdAt ? new Date(v.createdAt).toLocaleString('ro-RO') : ''}</div>
                      <div className="mt-2 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => rollback(v.version)}>
                          Rollback
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
