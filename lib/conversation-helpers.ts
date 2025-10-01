import { db } from "@/db";
import { conversations } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
import { logConversationCreated } from "@/lib/audit";

/**
 * Ensure a conversation exists between buyer and seller for an order
 * Creates conversation if it doesn't exist, returns existing if it does
 */
export async function ensureConversation(
  orderId: string,
  buyerId: string,
  sellerId: string
): Promise<string> {
  // Check if conversation already exists
  const existingConversation = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.orderId, orderId),
      eq(conversations.buyerId, buyerId),
      eq(conversations.sellerId, sellerId)
    ))
    .limit(1);
  
  if (existingConversation.length > 0) {
    return existingConversation[0].id;
  }
  
  // Create new conversation
  const newConversation = await db
    .insert(conversations)
    .values({
      orderId,
      buyerId,
      sellerId,
    })
    .returning({ id: conversations.id });
  
  // Log conversation creation
  await logConversationCreated(
    orderId,
    newConversation[0].id,
    buyerId,
    sellerId
  );
  
  return newConversation[0].id;
}
