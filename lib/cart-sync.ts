import { db } from "@/db";
import { carts, cartItems } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { getSessionId } from "@/lib/cookies";
import { normalizeCurrency } from "@/lib/money";

/**
 * Sync cart from sessionId (guest) to userId (authenticated user)
 * This function transfers all cart items from the anonymous session cart to the user's cart
 */
export async function syncCartFromSessionToUser(userId: string): Promise<void> {
  try {
    // Get sessionId from cookies
    const sessionId = getSessionId();
    
    if (!sessionId) {
      // No session cart to sync
      return;
    }

    // Find the session cart
    const sessionCartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);

    const sessionCart = sessionCartResult[0];
    
    if (!sessionCart) {
      // No session cart exists
      return;
    }

    // Get all items from session cart
    const sessionCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, sessionCart.id));

    if (sessionCartItems.length === 0) {
      // No items to transfer, delete empty session cart
      await db.delete(carts).where(eq(carts.id, sessionCart.id));
      return;
    }

    // Find or create user cart
    const userCartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    let userCart;
    if (userCartResult[0]) {
      userCart = userCartResult[0];
    } else {
      const newUserCart = await db
        .insert(carts)
        .values({
          userId,
          currency: sessionCart.currency || 'RON',
        })
        .returning();
      userCart = newUserCart[0];
    }

    // Transfer items from session cart to user cart
    for (const sessionItem of sessionCartItems) {
      // Check if item already exists in user cart
      const existingItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productId, sessionItem.productId)
          )
        )
        .limit(1);

      if (existingItem[0]) {
        // Merge quantities (add session cart quantity to user cart quantity, max 99)
        const newQty = Math.min(existingItem[0].qty + sessionItem.qty, 99);
        await db
          .update(cartItems)
          .set({ qty: newQty })
          .where(eq(cartItems.id, existingItem[0].id));
      } else {
        // Add new item to user cart
        await db
          .insert(cartItems)
          .values({
            cartId: userCart.id,
            productId: sessionItem.productId,
            qty: sessionItem.qty,
            priceCents: sessionItem.priceCents,
            currency: sessionItem.currency,
          });
      }
    }

    // Delete session cart (cartItems will be cascade deleted)
    await db.delete(carts).where(eq(carts.id, sessionCart.id));

  } catch (error) {
    console.error('[syncCartFromSessionToUser] Error syncing cart:', error);
    // Don't throw - cart sync failure shouldn't block login
  }
}
