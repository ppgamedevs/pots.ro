import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerPageVersions, sellerPages, sellers } from '@/db/schema/core';
import { and, eq, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

const schema = z.object({
  versionId: z.string().uuid(),
  message: z.string().min(10).max(500),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = schema.parse(body);

    const [v] = await db
      .select({
        id: sellerPageVersions.id,
        version: sellerPageVersions.version,
        aboutMd: sellerPageVersions.aboutMd,
        seoTitle: sellerPageVersions.seoTitle,
        seoDesc: sellerPageVersions.seoDesc,
        logoUrl: sellerPageVersions.logoUrl,
        bannerUrl: sellerPageVersions.bannerUrl,
      })
      .from(sellerPageVersions)
      .where(and(eq(sellerPageVersions.id, data.versionId), eq(sellerPageVersions.sellerId, sellerId)))
      .limit(1);

    if (!v) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

    const aboutMd = v.aboutMd || '';

    await db
      .insert(sellerPages)
      .values({
        sellerId,
        aboutMd,
        seoTitle: v.seoTitle ?? null,
        seoDesc: v.seoDesc ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sellerPages.sellerId,
        set: {
          aboutMd,
          seoTitle: v.seoTitle ?? null,
          seoDesc: v.seoDesc ?? null,
          updatedAt: new Date(),
        },
      });

    await db
      .update(sellers)
      .set({
        logoUrl: v.logoUrl ?? null,
        bannerUrl: v.bannerUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, sellerId));

    const [agg] = await db
      .select({ maxVersion: max(sellerPageVersions.version) })
      .from(sellerPageVersions)
      .where(eq(sellerPageVersions.sellerId, sellerId));

    const nextVersion = (agg?.maxVersion ?? 0) + 1;

    const [published] = await db
      .insert(sellerPageVersions)
      .values({
        sellerId,
        version: nextVersion,
        status: 'published',
        aboutMd,
        seoTitle: v.seoTitle ?? null,
        seoDesc: v.seoDesc ?? null,
        logoUrl: v.logoUrl ?? null,
        bannerUrl: v.bannerUrl ?? null,
        createdBy: user.id,
        createdAt: new Date(),
        publishedBy: user.id,
        publishedAt: new Date(),
        meta: { kind: 'rollback', fromVersionId: v.id, fromVersion: v.version },
      })
      .returning({ id: sellerPageVersions.id, version: sellerPageVersions.version, publishedAt: sellerPageVersions.publishedAt });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'content_rollback',
        message: data.message,
        meta: { toVersionId: v.id, toVersion: v.version, publishedVersion: nextVersion },
        adminUserId: user.id,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({ ok: true, published });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error rolling back seller content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
