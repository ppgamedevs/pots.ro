import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sellerActions, sellerPageVersions, sellerPages, sellers } from '@/db/schema/core';
import { eq, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';

export const dynamic = 'force-dynamic';

const publishSchema = z.object({
  // If provided, publish a previous draft/version directly.
  versionId: z.string().uuid().optional(),

  // Or publish provided payload.
  aboutMd: z.string().min(1).max(20000).optional(),
  seoTitle: z.string().max(120).nullable().optional(),
  seoDesc: z.string().max(300).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),

  message: z.string().min(3).max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'support') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = publishSchema.parse(body);

    let payload: { aboutMd: string; seoTitle?: string | null; seoDesc?: string | null; logoUrl?: string | null; bannerUrl?: string | null } | null = null;

    if (data.versionId) {
      const [v] = await db
        .select({
          aboutMd: sellerPageVersions.aboutMd,
          seoTitle: sellerPageVersions.seoTitle,
          seoDesc: sellerPageVersions.seoDesc,
          logoUrl: sellerPageVersions.logoUrl,
          bannerUrl: sellerPageVersions.bannerUrl,
          version: sellerPageVersions.version,
        })
        .from(sellerPageVersions)
        .where(eq(sellerPageVersions.id, data.versionId))
        .limit(1);

      if (!v) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      payload = {
        aboutMd: v.aboutMd || '',
        seoTitle: v.seoTitle ?? null,
        seoDesc: v.seoDesc ?? null,
        logoUrl: v.logoUrl ?? null,
        bannerUrl: v.bannerUrl ?? null,
      };
    } else {
      if (!data.aboutMd) return NextResponse.json({ error: 'aboutMd is required' }, { status: 400 });
      payload = {
        aboutMd: data.aboutMd,
        seoTitle: data.seoTitle ?? null,
        seoDesc: data.seoDesc ?? null,
        logoUrl: data.logoUrl ?? null,
        bannerUrl: data.bannerUrl ?? null,
      };
    }

    // Upsert published snapshot
    await db
      .insert(sellerPages)
      .values({
        sellerId,
        aboutMd: payload.aboutMd,
        seoTitle: payload.seoTitle,
        seoDesc: payload.seoDesc,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sellerPages.sellerId,
        set: {
          aboutMd: payload.aboutMd,
          seoTitle: payload.seoTitle,
          seoDesc: payload.seoDesc,
          updatedAt: new Date(),
        },
      });

    await db
      .update(sellers)
      .set({
        logoUrl: payload.logoUrl ?? null,
        bannerUrl: payload.bannerUrl ?? null,
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
        aboutMd: payload.aboutMd,
        seoTitle: payload.seoTitle,
        seoDesc: payload.seoDesc,
        logoUrl: payload.logoUrl,
        bannerUrl: payload.bannerUrl,
        createdBy: user.id,
        createdAt: new Date(),
        publishedBy: user.id,
        publishedAt: new Date(),
        meta: { source: 'admin', kind: 'publish', fromVersionId: data.versionId || null },
      })
      .returning({ id: sellerPageVersions.id, version: sellerPageVersions.version, publishedAt: sellerPageVersions.publishedAt });

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: 'content_publish',
        message: data.message?.trim() || 'Published seller page',
        meta: { version: nextVersion, fromVersionId: data.versionId || null },
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
    console.error('Error publishing seller content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
