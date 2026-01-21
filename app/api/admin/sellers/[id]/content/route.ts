import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerPageVersions, sellerPages, sellers } from '@/db/schema/core';
import { and, desc, eq, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

const draftSchema = z.object({
  aboutMd: z.string().min(1).max(20000),
  seoTitle: z.string().max(120).nullable().optional(),
  seoDesc: z.string().max(300).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  message: z.string().min(3).max(500).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [row] = await db
      .select({
        sellerId: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
        logoUrl: sellers.logoUrl,
        bannerUrl: sellers.bannerUrl,
        aboutMd: sellerPages.aboutMd,
        seoTitle: sellerPages.seoTitle,
        seoDesc: sellerPages.seoDesc,
      })
      .from(sellers)
      .leftJoin(sellerPages, eq(sellerPages.sellerId, sellers.id))
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [draft] = await db
      .select({
        id: sellerPageVersions.id,
        version: sellerPageVersions.version,
        aboutMd: sellerPageVersions.aboutMd,
        seoTitle: sellerPageVersions.seoTitle,
        seoDesc: sellerPageVersions.seoDesc,
        logoUrl: sellerPageVersions.logoUrl,
        bannerUrl: sellerPageVersions.bannerUrl,
        createdAt: sellerPageVersions.createdAt,
      })
      .from(sellerPageVersions)
      .where(and(eq(sellerPageVersions.sellerId, sellerId), eq(sellerPageVersions.status, 'draft')))
      .orderBy(desc(sellerPageVersions.version))
      .limit(1);

    const versions = await db
      .select({
        id: sellerPageVersions.id,
        version: sellerPageVersions.version,
        status: sellerPageVersions.status,
        createdAt: sellerPageVersions.createdAt,
        publishedAt: sellerPageVersions.publishedAt,
        meta: sellerPageVersions.meta,
      })
      .from(sellerPageVersions)
      .where(eq(sellerPageVersions.sellerId, sellerId))
      .orderBy(desc(sellerPageVersions.version))
      .limit(30);

    return NextResponse.json({
      seller: { id: row.sellerId, slug: row.slug, brandName: row.brandName },
      current: {
        aboutMd: row.aboutMd || '',
        seoTitle: row.seoTitle,
        seoDesc: row.seoDesc,
        logoUrl: row.logoUrl,
        bannerUrl: row.bannerUrl,
      },
      draft: draft || null,
      versions,
    });
  } catch (error) {
    console.error('Error fetching seller content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = draftSchema.parse(body);

    const [agg] = await db
      .select({
        maxVersion: max(sellerPageVersions.version),
      })
      .from(sellerPageVersions)
      .where(eq(sellerPageVersions.sellerId, sellerId));

    const nextVersion = (agg?.maxVersion ?? 0) + 1;

    const [created] = await db
      .insert(sellerPageVersions)
      .values({
        sellerId,
        version: nextVersion,
        status: 'draft',
        aboutMd: data.aboutMd,
        seoTitle: data.seoTitle ?? null,
        seoDesc: data.seoDesc ?? null,
        logoUrl: data.logoUrl ?? null,
        bannerUrl: data.bannerUrl ?? null,
        createdBy: user.id,
        createdAt: new Date(),
        meta: { source: 'admin', kind: 'draft' },
      })
      .returning({ id: sellerPageVersions.id, version: sellerPageVersions.version, createdAt: sellerPageVersions.createdAt });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'content_draft_save',
        message: data.message?.trim() || 'Saved seller page draft',
        meta: { version: nextVersion },
        adminUserId: user.id,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true, draft: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error saving seller content draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
