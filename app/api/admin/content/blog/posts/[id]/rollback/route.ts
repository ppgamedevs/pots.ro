import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { blogPosts, blogPostVersions } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

const schema = z.object({
  version: z.number().int().min(1),
});

async function nextVersion(postId: string): Promise<number> {
  const [row] = await db
    .select({ v: sql<number>`coalesce(max(${blogPostVersions.version}), 0)::int` })
    .from(blogPostVersions)
    .where(eq(blogPostVersions.postId, postId));
  return (row?.v ?? 0) + 1;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireRole(req, ['admin']);
    const id = ctx.params.id;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const source = await db.query.blogPostVersions.findFirst({
      where: and(eq(blogPostVersions.postId, id), eq(blogPostVersions.version, parsed.data.version)),
    } as any);

    if (!source) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const version = await nextVersion(id);

    await db.insert(blogPostVersions).values({
      postId: id,
      version,
      status: 'draft',
      authorId: source.authorId,
      title: source.title,
      excerpt: source.excerpt,
      coverUrl: source.coverUrl,
      bodyMd: source.bodyMd,
      seoTitle: source.seoTitle,
      seoDesc: source.seoDesc,
      createdBy: actor.id,
      createdAt: now,
      meta: { source: 'rollback', fromVersion: parsed.data.version },
    });

    await db
      .update(blogPosts)
      .set({
        authorId: source.authorId,
        title: source.title,
        excerpt: source.excerpt,
        coverUrl: source.coverUrl,
        bodyMd: source.bodyMd,
        seoTitle: source.seoTitle,
        seoDesc: source.seoDesc,
        status: 'draft' as any,
        publishedAt: null,
        scheduledAt: null,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'content.blog.post_rollback',
      entityType: 'blog_post',
      entityId: id,
      meta: { toVersion: version, fromVersion: parsed.data.version },
    });

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
