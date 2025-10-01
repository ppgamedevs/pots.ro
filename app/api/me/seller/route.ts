import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellers } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, user.id))
      .limit(1);

    if (seller.length === 0) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: seller[0].id,
      slug: seller[0].slug,
      brand_name: seller[0].brandName,
      about: seller[0].about,
      created_at: seller[0].createdAt,
      updated_at: seller[0].updatedAt,
    });

  } catch (error) {
    console.error("Get seller error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
