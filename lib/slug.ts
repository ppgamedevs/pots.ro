import { db } from "@/db";
import { eq, and, ne } from "drizzle-orm";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function slugifyUnique(
  table: any,
  title: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let condition = eq(table.slug, slug);
    
    if (excludeId) {
      // Find records with same slug but exclude the current record
      condition = and(eq(table.slug, slug), ne(table.id, excludeId));
    }
    
    const existing = await db.select().from(table).where(condition).limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

