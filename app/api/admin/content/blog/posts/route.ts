import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { blogPosts, blogPostVersions, contentAuthors } from '@/db/schema/core';
import { requireRole } from '@/lib/authz';
import { slugifyUnique } from '@/lib/slug';
import { writeAdminAudit } from '@/lib/admin/audit';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  bodyMd: z.string().optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDesc: z.string().max(300).optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
});

const statusEnum = z.enum(['draft', 'published', 'scheduled', 'archived']);

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'support']);

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();
    const authorId = (url.searchParams.get('authorId') || '').trim();

    const page = clampInt(url.searchParams.get('page'), 1, 1, 10_000);
    const pageSize = clampInt(url.searchParams.get('pageSize'), 20, 1, 200);
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    if (q) {
      const search = `%${q}%`;
      conditions.push(or(ilike(blogPosts.title, search), ilike(blogPosts.slug, search)));
    }
    if (status && statusEnum.safeParse(status).success) {
      conditions.push(eq(blogPosts.status, status as any));
    }
    if (authorId) {
      conditions.push(eq(blogPosts.authorId, authorId));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    type PostListRow = {
      id: string;
      slug: string;
      slugLocked: boolean;
      title: string;
      excerpt: string | null;
      coverUrl: string | null;
      status: string;
      publishedAt: Date | null;
      scheduledAt: Date | null;
      updatedAt: Date;
      authorName: string | null;
      authorSlug: string | null;
    };

    const [rows, totalRows] = await Promise.all([
      (db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          slugLocked: blogPosts.slugLocked,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          coverUrl: blogPosts.coverUrl,
          status: blogPosts.status,
          publishedAt: blogPosts.publishedAt,
          scheduledAt: blogPosts.scheduledAt,
          updatedAt: blogPosts.updatedAt,
          authorName: contentAuthors.name,
          authorSlug: contentAuthors.slug,
        })
        .from(blogPosts)
        .leftJoin(contentAuthors, eq(blogPosts.authorId, contentAuthors.id))
        .where(where)
        .orderBy(desc(blogPosts.updatedAt))
        .limit(pageSize)
        .offset(offset)) as Promise<PostListRow[]>,
      db.select({ count: sql<number>`count(*)::int` }).from(blogPosts).where(where),
    ]);

    const total = totalRows?.[0]?.count ?? 0;

    return NextResponse.json({
      page,
      pageSize,
      total,
      items: rows.map((r: PostListRow) => ({
        ...r,
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
        scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, ['admin', 'support']);

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.issues }, { status: 400 });
    }

    const input = parsed.data;

    const slug = await slugifyUnique(blogPosts, input.slug?.trim() || input.title);

    const now = new Date();
    const [created] = await db
      .insert(blogPosts)
      .values({
        slug,
        slugLocked: Boolean(input.slug?.trim()),
        authorId: input.authorId || null,
        title: input.title.trim(),
        excerpt: input.excerpt?.trim() || null,
        coverUrl: input.coverUrl?.trim() || null,
        bodyMd: input.bodyMd || null,
        seoTitle: input.seoTitle?.trim() || null,
        seoDesc: input.seoDesc?.trim() || null,
        status: 'draft',
        createdBy: actor.id,
        updatedBy: actor.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        authorId: blogPosts.authorId,
        excerpt: blogPosts.excerpt,
        coverUrl: blogPosts.coverUrl,
        bodyMd: blogPosts.bodyMd,
        seoTitle: blogPosts.seoTitle,
        seoDesc: blogPosts.seoDesc,
      });

    await db.insert(blogPostVersions).values({
      postId: created.id,
      version: 1,
      status: 'draft',
      authorId: created.authorId,
      title: created.title,
      excerpt: created.excerpt,
      coverUrl: created.coverUrl,
      bodyMd: created.bodyMd,
      seoTitle: created.seoTitle,
      seoDesc: created.seoDesc,
      createdBy: actor.id,
      createdAt: now,
      meta: { source: 'create' },
    });

    await writeAdminAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'content.blog.post_create',
      entityType: 'blog_post',
      entityId: created.id,
      meta: { slug: created.slug, title: created.title },
    });

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
