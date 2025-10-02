/**
 * Row Level Security (RLS) policies pentru Pots.ro
 * Implementare minimă cu Drizzle și Supabase Auth
 */

import { sql } from 'drizzle-orm';

// Helper pentru verificarea autentificării
export function getCurrentUserId(): string | null {
  // În implementarea reală, aceasta ar fi extrasă din token-ul JWT
  // Pentru MVP, folosim un header custom
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user-id');
  }
  return null;
}

// Helper pentru verificarea rolului admin
export function isAdmin(): boolean {
  const userId = getCurrentUserId();
  // Pentru MVP, verificăm dacă utilizatorul este în lista de admini
  const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  return userId ? adminIds.includes(userId) : false;
}

// Policies pentru tabela users
export const userPolicies = {
  // Fiecare utilizator își vede doar propriul rând
  select: sql`auth.uid() = id`,
  update: sql`auth.uid() = id`,
  delete: sql`auth.uid() = id`,
};

// Policies pentru tabela sellers
export const sellerPolicies = {
  // Seller: doar propriul rând, Admin: tot
  select: sql`auth.uid() = user_id OR ${isAdmin()}`,
  update: sql`auth.uid() = user_id OR ${isAdmin()}`,
  delete: sql`auth.uid() = user_id OR ${isAdmin()}`,
};

// Policies pentru tabela products
export const productPolicies = {
  // Public: doar produsele active, Seller: doar produsele proprii, Admin: tot
  select: sql`
    status = 'active' OR 
    seller_id = auth.uid() OR 
    ${isAdmin()}
  `,
  update: sql`seller_id = auth.uid() OR ${isAdmin()}`,
  delete: sql`seller_id = auth.uid() OR ${isAdmin()}`,
};

// Policies pentru tabela orders
export const orderPolicies = {
  // Buyer: doar comenzile proprii, Seller: doar comenzile unde apare, Admin: tot
  select: sql`
    buyer_id = auth.uid() OR 
    EXISTS(
      SELECT 1 FROM order_items oi 
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = auth.uid()
    ) OR 
    ${isAdmin()}
  `,
  update: sql`
    buyer_id = auth.uid() OR 
    EXISTS(
      SELECT 1 FROM order_items oi 
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = auth.uid()
    ) OR 
    ${isAdmin()}
  `,
  delete: sql`${isAdmin()}`, // Doar adminii pot șterge comenzi
};

// Policies pentru tabela payouts
export const payoutPolicies = {
  // Seller: doar payout-urile proprii, Admin: tot
  select: sql`seller_id = auth.uid() OR ${isAdmin()}`,
  update: sql`seller_id = auth.uid() OR ${isAdmin()}`,
  delete: sql`${isAdmin()}`, // Doar adminii pot șterge payout-uri
};

// Policies pentru tabela refunds
export const refundPolicies = {
  // Buyer: doar refund-urile pentru comenzile proprii, Seller: refund-urile pentru produsele proprii, Admin: tot
  select: sql`
    EXISTS(
      SELECT 1 FROM orders o 
      WHERE o.id = refunds.order_id 
      AND o.buyer_id = auth.uid()
    ) OR 
    EXISTS(
      SELECT 1 FROM orders o 
      JOIN order_items oi ON oi.order_id = o.id 
      WHERE o.id = refunds.order_id 
      AND oi.seller_id = auth.uid()
    ) OR 
    ${isAdmin()}
  `,
  update: sql`${isAdmin()}`, // Doar adminii pot actualiza refund-uri
  delete: sql`${isAdmin()}`, // Doar adminii pot șterge refund-uri
};

// Policies pentru tabela conversations
export const conversationPolicies = {
  // Utilizatorii pot vedea doar conversațiile în care sunt implicați
  select: sql`
    buyer_id = auth.uid() OR 
    seller_id = auth.uid() OR 
    ${isAdmin()}
  `,
  update: sql`
    buyer_id = auth.uid() OR 
    seller_id = auth.uid() OR 
    ${isAdmin()}
  `,
  delete: sql`${isAdmin()}`, // Doar adminii pot șterge conversații
};

// Policies pentru tabela messages
export const messagePolicies = {
  // Utilizatorii pot vedea doar mesajele din conversațiile lor
  select: sql`
    EXISTS(
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    ) OR 
    ${isAdmin()}
  `,
  insert: sql`
    EXISTS(
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    ) OR 
    ${isAdmin()}
  `,
  update: sql`
    sender_id = auth.uid() OR 
    ${isAdmin()}
  `,
  delete: sql`${isAdmin()}`, // Doar adminii pot șterge mesaje
};

// Funcție pentru aplicarea policy-urilor în query-uri
export function applyRLS<T>(
  query: any,
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete'
): any {
  const policies = getPoliciesForTable(tableName);
  const policy = (policies as any)[operation];
  
  if (policy) {
    return query.where(policy);
  }
  
  return query;
}

// Helper pentru obținerea policy-urilor pentru o tabelă
function getPoliciesForTable(tableName: string) {
  switch (tableName) {
    case 'users':
      return userPolicies;
    case 'sellers':
      return sellerPolicies;
    case 'products':
      return productPolicies;
    case 'orders':
      return orderPolicies;
    case 'payouts':
      return payoutPolicies;
    case 'refunds':
      return refundPolicies;
    case 'conversations':
      return conversationPolicies;
    case 'messages':
      return messagePolicies;
    default:
      return {};
  }
}

// Funcție pentru verificarea permisiunilor înainte de operațiuni
export function checkPermission(
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  resourceId?: string
): boolean {
  const userId = getCurrentUserId();
  if (!userId) return false;

  // Pentru operațiuni de citire, verificăm policy-urile
  if (operation === 'select') {
    return true; // Policy-urile se aplică în query
  }

  // Pentru operațiuni de modificare, verificăm permisiunile specifice
  switch (tableName) {
    case 'users':
      return resourceId === userId;
    case 'sellers':
      return true; // Se verifică în policy
    case 'products':
      return true; // Se verifică în policy
    case 'orders':
      return true; // Se verifică în policy
    case 'payouts':
      return true; // Se verifică în policy
    case 'refunds':
      return isAdmin(); // Doar adminii pot modifica refund-uri
    default:
      return false;
  }
}

// Export pentru toate policy-urile
export const RLS_POLICIES = {
  users: userPolicies,
  sellers: sellerPolicies,
  products: productPolicies,
  orders: orderPolicies,
  payouts: payoutPolicies,
  refunds: refundPolicies,
  conversations: conversationPolicies,
  messages: messagePolicies,
};
