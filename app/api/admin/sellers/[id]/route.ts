import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, sellerActions, sellers, users } from "@/db/schema/core";
import { eq, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { resolveSellerId } from "@/lib/server/resolve-seller-id";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  brandName: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/i, 'Slug invalid').optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(3).max(50).nullable().optional(),
  legalName: z.string().min(2).max(200).nullable().optional(),
  cui: z.string().min(2).max(50).nullable().optional(),
  iban: z.string().min(6).max(80).nullable().optional(),
  about: z.string().max(5000).nullable().optional(),
  returnPolicy: z.string().max(10000).nullable().optional(),
  shippingPrefs: z.any().nullable().optional(),
  isPlatform: z.boolean().optional(),
  auditMessage: z.string().max(500).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || (me.role !== 'admin' && me.role !== 'support')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rows = await db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
        status: sellers.status,
        phone: sellers.phone,
        email: sellers.email,
        legalName: sellers.legalName,
        cui: sellers.cui,
        iban: sellers.iban,
        about: sellers.about,
        returnPolicy: sellers.returnPolicy,
        shippingPrefs: sellers.shippingPrefs,
        createdAt: sellers.createdAt,
        updatedAt: sellers.updatedAt,
        isPlatform: sellers.isPlatform,
        userId: sellers.userId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(sellers)
      .leftJoin(users, eq(users.id, sellers.userId))
      .where(eq(sellers.id, sellerId))
      .limit(1);

    const seller = rows[0];
    if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [ordersAgg] = await db
      .select({
        ordersCount: sql<number>`count(*)::int`,
        revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(eq(orders.sellerId, sellerId));

    const [productsAgg] = await db
      .select({
        productsCount: sql<number>`count(*)::int`,
        activeProductsCount: sql<number>`coalesce(sum(case when ${products.status} = 'active' then 1 else 0 end), 0)::int`,
      })
      .from(products)
      .where(eq(products.sellerId, sellerId));

    return NextResponse.json({
      seller: {
        id: seller.id,
        slug: seller.slug,
        brandName: seller.brandName,
        status: seller.status,
        phone: seller.phone,
        email: seller.email,
        legalName: seller.legalName,
        cui: seller.cui,
        iban: seller.iban,
        about: seller.about,
        returnPolicy: seller.returnPolicy,
        shippingPrefs: seller.shippingPrefs,
        isPlatform: seller.isPlatform,
        createdAt: seller.createdAt?.toISOString?.() ?? String(seller.createdAt),
        updatedAt: seller.updatedAt?.toISOString?.() ?? String(seller.updatedAt),
        user: {
          id: seller.userId,
          email: seller.userEmail,
          name: seller.userName,
        },
      },
      stats: {
        ordersCount: ordersAgg?.ordersCount ?? 0,
        revenueCents: ordersAgg?.revenueCents ?? 0,
        lastOrderAt: ordersAgg?.lastOrderAt ? ordersAgg.lastOrderAt.toISOString() : null,
        productsCount: productsAgg?.productsCount ?? 0,
        activeProductsCount: productsAgg?.activeProductsCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching seller:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = patchSchema.parse(body);

    if (data.slug) {
      const [existing] = await db
        .select({ id: sellers.id })
        .from(sellers)
        .where(eq(sellers.slug, data.slug))
        .limit(1);
      if (existing && existing.id !== sellerId) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.brandName !== undefined) updates.brandName = data.brandName;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.legalName !== undefined) updates.legalName = data.legalName;
    if (data.cui !== undefined) updates.cui = data.cui;
    if (data.iban !== undefined) updates.iban = data.iban;
    if (data.about !== undefined) updates.about = data.about;
    if (data.returnPolicy !== undefined) updates.returnPolicy = data.returnPolicy;
    if (data.shippingPrefs !== undefined) updates.shippingPrefs = data.shippingPrefs;
    if (data.isPlatform !== undefined) updates.isPlatform = data.isPlatform;

    const [updated] = await db
      .update(sellers)
      .set(updates)
      .where(eq(sellers.id, sellerId))
      .returning({
        id: sellers.id,
        slug: sellers.slug,
        brandName: sellers.brandName,
        status: sellers.status,
        isPlatform: sellers.isPlatform,
      });

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const message = data.auditMessage?.trim() || 'Admin updated seller profile';

    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: data.isPlatform !== undefined ? 'set_platform' : 'update_profile',
        message,
        meta: {
          updatedFields: Object.keys(updates).filter((k) => k !== 'updatedAt'),
        },
        adminUserId: userId,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    return NextResponse.json({
      ok: true,
      seller: {
        id: updated.id,
        slug: updated.slug,
        brandName: updated.brandName,
        status: updated.status,
        isPlatform: updated.isPlatform,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error updating seller:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
