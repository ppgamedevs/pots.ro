import { products } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";

export function canReadProduct(user: { role: string; id: string } | null, product: { status: string; sellerId?: string }, sellerUserId?: string): boolean {
  // Public products are always readable
  if (product.status === 'active') {
    return true;
  }
  
  // Admins can read everything
  if (user?.role === 'admin') {
    return true;
  }
  
  // Sellers can read their own products
  if (user?.role === 'seller' && sellerUserId === user.id) {
    return true;
  }
  
  return false;
}

export function filterPublicProducts() {
  return eq(products.status, 'active');
}

export function filterUserProducts(userId: string) {
  return and(
    eq(products.status, 'active')
  );
}

export function filterSellerProducts(sellerId: string) {
  return eq(products.sellerId, sellerId);
}

export function filterOwnProducts(userId: string) {
  // This function requires a join with sellers table to work properly
  // Use filterSellerProducts with the actual sellerId instead
  throw new Error("filterOwnProducts requires seller lookup - use filterSellerProducts with sellerId");
}

