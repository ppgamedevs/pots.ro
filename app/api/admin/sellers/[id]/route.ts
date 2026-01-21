import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, sellers, users } from "@/db/schema/core";
import { eq, sql } from "drizzle-orm";
import { getUserId } from "@/lib/auth-helpers";
import { resolveSellerId } from "@/lib/server/resolve-seller-id";

export const dynamic = 'force-dynamic';

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
        createdAt: sellers.createdAt,
        updatedAt: sellers.updatedAt,
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
