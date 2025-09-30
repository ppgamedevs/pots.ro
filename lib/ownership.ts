import { db } from "@/db";
import { sellers, products } from "@/db/schema/core";
import { eq } from "drizzle-orm";

export async function getSellerByUser(userId: string) {
  const result = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);
  return result[0] || null;
}

export async function assertOwnProduct(productId: string, userId: string) {
  const result = await db
    .select({ 
      productId: products.id,
      sellerUserId: sellers.userId 
    })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(eq(products.id, productId))
    .limit(1);

  const product = result[0];
  if (!product) {
    throw new Error("Product not found");
  }

  if (product.sellerUserId !== userId) {
    throw new Error("Access denied: You don't own this product");
  }

  return product;
}

export async function getProductWithSeller(productId: string) {
  const result = await db
    .select({
      product: products,
      seller: sellers,
    })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(eq(products.id, productId))
    .limit(1);

  return result[0] || null;
}

