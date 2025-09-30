import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema/core";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        position: categories.position,
      })
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

