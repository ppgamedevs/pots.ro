import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { blogPosts } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { writeAdminAudit } from '@/lib/admin/audit';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireRole(req, ['admin']);
    const id = ctx.params.id;

    const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    await db
      .update(blogPosts)
      .set({
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
      action: 'content.blog.post_unpublish',
      entityType: 'blog_post',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
