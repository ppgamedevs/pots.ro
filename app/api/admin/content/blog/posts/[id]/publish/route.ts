import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { blogPosts, blogPostVersions } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

const schema = z.object({
  scheduledAt: z.string().datetime().optional().nullable(),
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

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
    const publishNow = !scheduledAt || scheduledAt.getTime() <= now.getTime();

    const version = await nextVersion(id);

    await db.insert(blogPostVersions).values({
      postId: id,
      version,
      status: 'published',
      authorId: post.authorId,
      title: post.title,
      excerpt: post.excerpt,
      coverUrl: post.coverUrl,
      bodyMd: post.bodyMd,
      seoTitle: post.seoTitle,
      seoDesc: post.seoDesc,
      createdBy: actor.id,
      createdAt: now,
      publishedBy: actor.id,
      publishedAt: publishNow ? now : scheduledAt,
      meta: { source: 'publish', scheduledAt: scheduledAt ? scheduledAt.toISOString() : null },
    });

    await db
      .update(blogPosts)
      .set({
        status: (publishNow ? 'published' : 'scheduled') as any,
        publishedAt: publishNow ? now : null,
        scheduledAt: publishNow ? null : scheduledAt,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id));

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'content.blog.post_publish',
      entityType: 'blog_post',
      entityId: id,
      meta: { version, publishNow, scheduledAt: scheduledAt ? scheduledAt.toISOString() : null },
    });

    return NextResponse.json({ ok: true, version, status: publishNow ? 'published' : 'scheduled' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
