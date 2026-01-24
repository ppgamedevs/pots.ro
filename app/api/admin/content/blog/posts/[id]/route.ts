import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { blogPosts, blogPostVersions, contentAuthors } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { slugifyUnique } from '@/lib/slug';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  bodyMd: z.string().optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDesc: z.string().max(300).optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
});

type Ctx = { params: { id: string } };

async function nextVersion(postId: string): Promise<number> {
  const [row] = await db
    .select({ v: sql<number>`coalesce(max(${blogPostVersions.version}), 0)::int` })
    .from(blogPostVersions)
    .where(eq(blogPostVersions.postId, postId));
  return (row?.v ?? 0) + 1;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireRole(req, ['admin', 'support']);
    const id = ctx.params.id;

    const [post] = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        slugLocked: blogPosts.slugLocked,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        coverUrl: blogPosts.coverUrl,
        bodyMd: blogPosts.bodyMd,
        seoTitle: blogPosts.seoTitle,
        seoDesc: blogPosts.seoDesc,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        scheduledAt: blogPosts.scheduledAt,
        updatedAt: blogPosts.updatedAt,
        authorId: blogPosts.authorId,
        authorName: contentAuthors.name,
        authorSlug: contentAuthors.slug,
      })
      .from(blogPosts)
      .leftJoin(contentAuthors, eq(blogPosts.authorId, contentAuthors.id))
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    type VersionRow = {
      id: string;
      version: number;
      status: string;
      createdAt: Date;
      publishedAt: Date | null;
      title: string;
    };

    const versions: VersionRow[] = await db
      .select({
        id: blogPostVersions.id,
        version: blogPostVersions.version,
        status: blogPostVersions.status,
        createdAt: blogPostVersions.createdAt,
        publishedAt: blogPostVersions.publishedAt,
        title: blogPostVersions.title,
      })
      .from(blogPostVersions)
      .where(eq(blogPostVersions.postId, id))
      .orderBy(desc(blogPostVersions.version))
      .limit(50);

    return NextResponse.json({
      post: {
        ...post,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
        updatedAt: post.updatedAt ? post.updatedAt.toISOString() : null,
      },
      versions: versions.map((v: VersionRow) => ({
        ...v,
        createdAt: v.createdAt ? v.createdAt.toISOString() : null,
        publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireRole(req, ['admin', 'support']);
    const id = ctx.params.id;

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const nextSlug = parsed.data.slug?.trim()
      ? await slugifyUnique(blogPosts, parsed.data.slug.trim(), id)
      : existing.slug;

    const now = new Date();

    const updated = {
      slug: nextSlug,
      slugLocked: parsed.data.slug ? true : existing.slugLocked,
      title: parsed.data.title?.trim() ?? existing.title,
      excerpt: parsed.data.excerpt === undefined ? existing.excerpt : parsed.data.excerpt?.trim() || null,
      coverUrl: parsed.data.coverUrl === undefined ? existing.coverUrl : parsed.data.coverUrl?.trim() || null,
      bodyMd: parsed.data.bodyMd === undefined ? existing.bodyMd : parsed.data.bodyMd || null,
      seoTitle: parsed.data.seoTitle === undefined ? existing.seoTitle : parsed.data.seoTitle?.trim() || null,
      seoDesc: parsed.data.seoDesc === undefined ? existing.seoDesc : parsed.data.seoDesc?.trim() || null,
      authorId: parsed.data.authorId === undefined ? existing.authorId : parsed.data.authorId || null,
      updatedBy: actor.id,
      updatedAt: now,
    };

    await db.update(blogPosts).set(updated).where(eq(blogPosts.id, id));

    const version = await nextVersion(id);
    await db.insert(blogPostVersions).values({
      postId: id,
      version,
      status: 'draft',
      authorId: updated.authorId,
      title: updated.title,
      excerpt: updated.excerpt,
      coverUrl: updated.coverUrl,
      bodyMd: updated.bodyMd,
      seoTitle: updated.seoTitle,
      seoDesc: updated.seoDesc,
      createdBy: actor.id,
      createdAt: now,
      meta: { source: 'edit' },
    });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'content.blog.post_update',
      entityType: 'blog_post',
      entityId: id,
      meta: { version },
    });

    return NextResponse.json({ ok: true, version });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
