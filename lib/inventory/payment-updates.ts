import { db } from '@/db';
import { products, orderItems } from '@/db/schema/core';
import { eq, sql } from 'drizzle-orm';
import { OrderPublic } from '@/types/checkout';

export async function updateInventoryAfterPayment(order: OrderPublic) {
  try {
    console.log('Updating inventory for order:', order.id);
    
    // Update stock for each item in the order
    for (const item of order.items) {
      await db
        .update(products)
        .set({
          stock: sql`stock - ${item.qty}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.product_id));
      
      console.log(`Updated stock for product ${item.product_id}: -${item.qty}`);
    }
    
    console.log('Inventory updated successfully for order:', order.id);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}

export async function restoreInventoryAfterCancellation(orderId: string) {
  try {
    console.log('Restoring inventory for cancelled order:', orderId);
    
    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    
    // Restore stock for each item
    for (const item of items) {
      await db
        .update(products)
        .set({
          stock: sql`stock + ${item.qty}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
      
      console.log(`Restored stock for product ${item.productId}: +${item.qty}`);
    }
    
    console.log('Inventory restored successfully for order:', orderId);
  } catch (error) {
    console.error('Error restoring inventory:', error);
    throw error;
  }
}
