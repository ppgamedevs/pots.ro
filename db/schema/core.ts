import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex, boolean, check, decimal, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'packed', 'shipped', 'delivered', 'canceled', 'refunded', 'return_requested', 'return_approved', 'returned']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'paid', 'failed']);
export const refundStatusEnum = pgEnum('refund_status', ['pending', 'processing', 'refunded', 'failed']);
export const ledgerTypeEnum = pgEnum('ledger_type', ['charge', 'commission', 'payout', 'refund', 'recovery']);
export const promotionTypeEnum = pgEnum('promotion_type', ['banner', 'discount']);
export const sellerApplicationStatusEnum = pgEnum('seller_application_status', ['received','in_review','need_info','approved','rejected']);
export const sellerStatusEnum = pgEnum('seller_status', ['onboarding','active','suspended']);

export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['open', 'in_progress', 'waiting_on_seller', 'resolved', 'closed']);
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority', ['low', 'normal', 'high', 'urgent']);

// Users table for passwordless auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  displayId: text("display_id").unique(), // Unique display ID for user greeting
  password: text("password"), // For password-based auth
  role: text("role").notNull().default("buyer").$type<'buyer' | 'seller' | 'admin' | 'support'>(),
  notificationPreferences: jsonb("notification_preferences"), // User notification settings
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  displayIdIdx: index("users_display_id_idx").on(table.displayId),
}));

// Sellers table (extended for onboarding)
export const sellers = pgTable("sellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  brandName: text("brand_name").notNull(),
  about: text("about"),
  legalName: text("legal_name"),
  cui: text("cui"),
  iban: text("iban"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  returnPolicy: text("return_policy"),
  shippingPrefs: jsonb("shipping_prefs"),
  status: sellerStatusEnum("status").notNull().default('onboarding'),
  isPlatform: boolean("is_platform").notNull().default(false), // true dacă este contul platformei (pentru produsele proprii)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sellersUserIdx: index("sellers_user_idx").on(table.userId),
  sellersSlugIdx: index("sellers_slug_idx").on(table.slug),
  sellersUserUnique: uniqueIndex("sellers_user_unique").on(table.userId),
  sellersEmailIdx: index("sellers_email_idx").on(table.email),
  sellersCuiIdx: index("sellers_cui_idx").on(table.cui),
}));

// Seller applications table
export const sellerApplications = pgTable("seller_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  cui: text("cui"),
  contactName: text("contact_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  iban: text("iban"),
  categories: jsonb("categories").$type<string[] | null>().default(null),
  website: text("website"),
  carrier: text("carrier"),
  returnPolicy: text("return_policy"),
  status: sellerApplicationStatusEnum("status").notNull().default('received'),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sellerApplicationsEmailIdx: index("seller_app_email_idx").on(table.email),
  sellerApplicationsCuiIdx: index("seller_app_cui_idx").on(table.cui),
}));

// Seller notes (visible only to admin/support)
export const sellerNotes = pgTable(
  "seller_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sellerNotesSellerIdx: index("seller_notes_seller_idx").on(table.sellerId),
    sellerNotesCreatedIdx: index("seller_notes_created_idx").on(table.sellerId, table.createdAt),
  })
);

// Support tickets for sellers
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    status: supportTicketStatusEnum("status").notNull().default("open"),
    priority: supportTicketPriorityEnum("priority").notNull().default("normal"),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportTicketsSellerIdx: index("support_tickets_seller_idx").on(table.sellerId),
    supportTicketsStatusIdx: index("support_tickets_status_idx").on(table.status),
    supportTicketsPriorityIdx: index("support_tickets_priority_idx").on(table.priority),
    supportTicketsUpdatedIdx: index("support_tickets_updated_idx").on(table.updatedAt),
  })
);

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportTicketMessagesTicketIdx: index("support_ticket_messages_ticket_idx").on(table.ticketId),
  })
);

// Direct 1:1 support conversation for a seller (separate from tickets)
export const supportConversations = pgTable(
  "support_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().unique().references(() => sellers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportConversationsSellerIdx: index("support_conversations_seller_idx").on(table.sellerId),
  })
);

export const supportConversationMessages = pgTable(
  "support_conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => supportConversations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    authorRole: text("author_role").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportConversationMessagesConvIdx: index("support_conversation_messages_conv_idx").on(table.conversationId),
  })
);

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoriesParentIdx: index("categories_parent_idx").on(table.parentId),
  categoriesSlugIdx: index("categories_slug_idx").on(table.slug),
}));

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("RON"),
  stock: integer("stock").notNull().default(0),
  status: productStatusEnum("status").notNull().default("draft"),
  attributes: jsonb("attributes").notNull().default({}),
  searchTsv: text("search_tsv"), // tsvector column (converted in migration)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxProductsSlug: index("idx_products_slug").on(table.slug),
  idxProductsStatus: index("idx_products_status").on(table.status),
  idxProductsSeller: index("idx_products_seller").on(table.sellerId),
}));

// Product images table
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productImagesProductIdx: index("product_images_product_idx").on(table.productId),
}));

// Seller pages table
export const sellerPages = pgTable("seller_pages", {
  sellerId: uuid("seller_id").primaryKey().references(() => sellers.id, { onDelete: "cascade" }),
  aboutMd: text("about_md"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: promotionTypeEnum("type").notNull(),
  percent: integer("percent"), // 0-100 for percentage discount
  value: integer("value"), // RON for fixed discount (in cents)
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
  sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
  targetCategorySlug: text("target_category_slug"),
  targetProductId: uuid("target_product_id").references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  promotionsSellerIdx: index("promotions_seller_idx").on(table.sellerId),
  promotionsActiveIdx: index("promotions_active_idx").on(table.active),
  promotionsTypeIdx: index("promotions_type_idx").on(table.type),
  promotionsTargetIdx: index("promotions_target_idx").on(table.targetCategorySlug, table.targetProductId),
}));

// Cart tables
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  currency: text("currency").notNull().default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartsUserIdx: index("carts_user_idx").on(table.userId),
  cartsSessionIdx: index("carts_session_idx").on(table.sessionId),
  cartsUserUnique: uniqueIndex("carts_user_unique").on(table.userId).where(sql`user_id IS NOT NULL`),
  cartsSessionUnique: uniqueIndex("carts_session_unique").on(table.sessionId).where(sql`session_id IS NOT NULL`),
}));

// GDPR preferences table
export const gdprPreferences = pgTable("gdpr_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // Email-ul utilizatorului
  consentType: text("consent_type").notNull().$type<"necessary" | "all">(), // "necessary" or "all"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gdprPreferencesEmailIdx: index("gdpr_preferences_email_idx").on(table.email),
}));

// Saved payment cards table
export const savedPaymentCards = pgTable("saved_payment_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  last4Digits: text("last_4_digits").notNull(), // Last 4 digits of card number
  brand: text("brand").notNull(), // "visa", "mastercard", etc.
  expiryMonth: integer("expiry_month").notNull(), // 1-12
  expiryYear: integer("expiry_year").notNull(), // YYYY
  cardholderName: text("cardholder_name"),
  providerToken: text("provider_token"), // Token from payment provider (Netopia) if available
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  savedCardsUserIdx: index("saved_cards_user_idx").on(table.userId),
  savedCardsDefaultIdx: index("saved_cards_default_idx").on(table.userId, table.isDefault),
}));

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  qty: integer("qty").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartItemsCartIdx: index("cart_items_cart_idx").on(table.cartId),
  cartItemsProductIdx: index("cart_items_product_idx").on(table.productId),
  cartItemsUnique: uniqueIndex("cart_items_unique").on(table.cartId, table.productId),
}));

// Auth OTP table for passwordless authentication
export const authOtp = pgTable("auth_otp", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  magicTokenHash: varchar("magic_token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  ip: text("ip"),
  userAgent: text("ua"),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailExpiresIdx: index("auth_otp_email_expires_idx").on(table.email, table.expiresAt),
  emailCreatedIdx: index("auth_otp_email_created_idx").on(table.email, table.createdAt),
  consumedAtIdx: index("auth_otp_consumed_at_idx").on(table.consumedAt),
}));

// Sessions table for httpOnly cookies
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionTokenHash: varchar("session_token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ip: text("ip"),
  userAgent: text("ua"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  userIdExpiresIdx: index("sessions_user_id_expires_idx").on(table.userId, table.expiresAt),
  sessionTokenHashIdx: index("sessions_token_hash_idx").on(table.sessionTokenHash),
  revokedAtIdx: index("sessions_revoked_at_idx").on(table.revokedAt),
}));

// Auth audit table for security logging
export const authAudit = pgTable("auth_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  userId: uuid("user_id").references(() => users.id),
  kind: text("kind").notNull().$type<'otp_request' | 'otp_verify' | 'login' | 'logout' | 'rate_limit' | 'otp_expired' | 'otp_denied'>(),
  ip: text("ip"),
  userAgent: text("ua"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("auth_audit_email_idx").on(table.email),
  userIdIdx: index("auth_audit_user_id_idx").on(table.userId),
  kindIdx: index("auth_audit_kind_idx").on(table.kind),
}));

// User actions table for tracking suspend/reactivate/role_change actions
export const userActions = pgTable("user_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull().$type<'suspend' | 'reactivate' | 'role_change'>(),
  message: text("message"),
  oldRole: text("old_role").$type<'buyer' | 'seller' | 'admin' | 'support'>(),
  newRole: text("new_role").$type<'buyer' | 'seller' | 'admin' | 'support'>(),
  adminUserId: uuid("admin_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userActionsUserIdIdx: index("user_actions_user_id_idx").on(table.userId),
  userActionsCreatedIdx: index("user_actions_created_idx").on(table.createdAt),
}));

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(), // Format: ORD-YYYYMMDD-XXXXX pentru URL prietenos
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  currency: text("currency").notNull().default("RON"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  shippingFeeCents: integer("shipping_fee_cents").notNull().default(0),
  totalDiscountCents: integer("total_discount_cents").notNull().default(0), // Week 10: total discount applied
  totalCents: integer("total_cents").notNull().default(0),
  paymentRef: text("payment_ref"),
  shippingAddress: jsonb("shipping_address").notNull(),
  awbNumber: text("awb_number"),
  awbLabelUrl: text("awb_label_url"),
  carrierMeta: jsonb("carrier_meta"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  canceledReason: text("canceled_reason"),
  deliveryStatus: text("delivery_status"),
  // Timestamps pentru tracking status-uri
  paidAt: timestamp("paid_at", { withTimezone: true }),
  packedAt: timestamp("packed_at", { withTimezone: true }), // Când seller preia comanda
  shippedAt: timestamp("shipped_at", { withTimezone: true }), // Când se predă curierului
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ordersBuyerIdx: index("orders_buyer_idx").on(table.buyerId),
  ordersSellerIdx: index("orders_seller_idx").on(table.sellerId),
  ordersOrderNumberIdx: index("orders_order_number_idx").on(table.orderNumber), // Index pentru lookup rapid
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "restrict" }),
  qty: integer("qty").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0), // Week 10: discount applied per item
  subtotalCents: integer("subtotal_cents").notNull(),
  commissionPct: integer("commission_pct").notNull(), // stored as basis points (e.g., 1000 = 10%)
  commissionAmountCents: integer("commission_amount_cents").notNull(),
  sellerDueCents: integer("seller_due_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderItemsOrderIdx: index("oi_order_idx").on(table.orderId),
  orderItemsQtyCheck: check("order_items_qty_positive", sql`qty > 0`),
}));

// Audit log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  auditLogsOrderIdx: index("audit_logs_order_idx").on(table.orderId),
  auditLogsOrderCreatedIdx: index("audit_logs_order_created_idx").on(table.orderId, table.createdAt),
}));

// Webhook events table
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // provider event id for idempotency
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookEventsOrderIdx: index("webhook_events_order_idx").on(table.orderId),
}));

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationsOrderBuyerSellerUnique: uniqueIndex("conversations_order_buyer_seller_unique").on(table.orderId, table.buyerId, table.sellerId),
}));

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  messagesConversationIdx: index("messages_conversation_idx").on(table.conversationId),
  messagesConversationCreatedIdx: index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
}));

// Invoice table
// Tipuri de facturi:
// - 'commission' - factura de comision emisă de platformă
// - 'seller' - factura principală emisă de vânzător (atașată manual)
// - 'platform' - factura pentru produsele proprii ale platformei (emise automat)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<'commission' | 'seller' | 'platform'>().default('commission'),
  series: text("series").notNull(),
  number: text("number").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  total: decimal("total", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("RON"),
  issuer: text("issuer").notNull().$type<'smartbill' | 'facturis' | 'mock' | 'seller'>(),
  status: text("status").notNull().$type<'issued' | 'voided' | 'error'>(),
  // Pentru factura vânzătorului (când type = 'seller')
  sellerInvoiceNumber: text("seller_invoice_number"), // Numărul facturii emise de vânzător
  uploadedBy: uuid("uploaded_by").references(() => users.id), // User-ul care a încărcat factura
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }), // Când a fost încărcată
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  invoicesOrderUnique: uniqueIndex("invoices_order_unique").on(table.orderId, table.type), // Permite multiple facturi per comandă (comision + seller)
  invoicesCreatedIdx: index("invoices_created_idx").on(table.createdAt),
}));

// Email events table
export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().$type<'order_paid' | 'order_shipped' | 'order_delivered' | 'message_created'>(),
  toEmail: text("to_email").notNull(),
  meta: jsonb("meta"),
  status: text("status").notNull().$type<'sent' | 'retry' | 'failed'>(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailEventsTypeCreatedIdx: index("email_events_type_created_idx").on(table.type, table.createdAt),
}));

// Webhook logs table
export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull().$type<'payments' | 'shipping' | 'invoices' | 'orders' | 'refunds' | 'payouts'>(),
  ref: text("ref"),
  payload: jsonb("payload").notNull(),
  result: text("result").$type<'ok' | 'duplicate' | 'error'>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookLogsSourceCreatedIdx: index("webhook_logs_source_created_idx").on(table.source, table.createdAt),
}));

// Week 7: Payouts table
export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("RON"),
  status: payoutStatusEnum("status").notNull().default("pending"),
  providerRef: text("provider_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  payoutsOrderSellerIdx: index("payouts_order_seller_idx").on(table.orderId, table.sellerId, table.status),
}));

// Week 7: Refunds table
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").notNull().default("pending"),
  providerRef: text("provider_ref"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  refundsOrderIdx: index("refunds_order_idx").on(table.orderId, table.status),
}));

// Week 7: Conversation flags table
export const conversationFlags = pgTable("conversation_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }).unique(),
  bypassSuspected: boolean("bypass_suspected").notNull().default(false),
  attempts24h: integer("attempts_24h").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Week 7: Ledger table
export const ledger = pgTable("ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: ledgerTypeEnum("type").notNull(),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull().$type<'order' | 'payout' | 'refund' | 'seller' | 'platform'>(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(), // pozitiv = intrare pt. platformă, negativ = ieșire
  currency: text("currency").notNull().default("RON"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ledgerTypeCreatedIdx: index("ledger_type_created_idx").on(table.type, table.createdAt),
}));

// Week 10: Analytics tables
export const sellerStatsDaily = pgTable("seller_stats_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  views: integer("views").notNull().default(0),
  addToCart: integer("add_to_cart").notNull().default(0),
  orders: integer("orders").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // in cents
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sellerStatsSellerDateIdx: uniqueIndex("seller_stats_seller_date_idx").on(table.sellerId, table.date),
  sellerStatsDateIdx: index("seller_stats_date_idx").on(table.date),
}));

export const productStatsDaily = pgTable("product_stats_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  views: integer("views").notNull().default(0),
  addToCart: integer("add_to_cart").notNull().default(0),
  orders: integer("orders").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // in cents
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productStatsProductDateIdx: uniqueIndex("product_stats_product_date_idx").on(table.productId, table.date),
  productStatsDateIdx: index("product_stats_date_idx").on(table.date),
}));

// Raw events table (optional for audit)
export const eventsRaw = pgTable("events_raw", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventsTypeIdx: index("events_type_idx").on(table.eventType),
  eventsProductIdx: index("events_product_idx").on(table.productId),
  eventsSellerIdx: index("events_seller_idx").on(table.sellerId),
  eventsDateIdx: index("events_date_idx").on(table.createdAt),
}));

// SQL for triggers and additional indexes
export const createTriggersAndIndexes = sql`
  -- Add foreign key constraint for categories self-reference
  ALTER TABLE categories ADD CONSTRAINT fk_categories_parent 
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

  -- Add cart constraints
  ALTER TABLE carts ADD CONSTRAINT carts_who 
    CHECK ( (user_id IS NOT NULL) OR (session_id IS NOT NULL) );
  
  ALTER TABLE cart_items ADD CONSTRAINT cart_items_qty_positive 
    CHECK (qty > 0);

  -- Create pg_trgm extension for trigram search
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Triggers for updated_at
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_seller_pages_updated_at BEFORE UPDATE ON seller_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Function to decrement stock when order is paid
  CREATE OR REPLACE FUNCTION decrement_stock_on_paid()
  RETURNS TRIGGER AS $$
  DECLARE
    item RECORD;
    current_stock INTEGER;
  BEGIN
    -- Only process when status changes to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
      -- Check stock for all items in this order
      FOR item IN 
        SELECT product_id, qty 
        FROM order_items 
        WHERE order_id = NEW.id
      LOOP
        -- Get current stock
        SELECT stock INTO current_stock 
        FROM products 
        WHERE id = item.product_id;
        
        -- Check if sufficient stock
        IF current_stock < item.qty THEN
          RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %', 
            item.product_id, item.qty, current_stock;
        END IF;
      END LOOP;
      
      -- Decrement stock for all items
      UPDATE products 
      SET stock = stock - order_items.qty,
          updated_at = NOW()
      FROM order_items 
      WHERE products.id = order_items.product_id 
        AND order_items.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Trigger for stock decrement
  CREATE TRIGGER decrement_stock_on_paid_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_paid();

  -- Function to update search_tsv
  CREATE OR REPLACE FUNCTION update_products_search_tsv()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_tsv = 
      setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
      setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B');
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Trigger for search_tsv
  CREATE TRIGGER update_products_search_tsv_trigger 
    BEFORE INSERT OR UPDATE OF title, description ON products
    FOR EACH ROW EXECUTE FUNCTION update_products_search_tsv();

  -- Create GIN index for full-text search
  CREATE INDEX IF NOT EXISTS idx_products_search_tsv ON products USING GIN (search_tsv);

  -- Create partial unique index for product_images is_primary
  CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary
    ON product_images(product_id)
    WHERE is_primary = true;

  -- Create products search view
  CREATE OR REPLACE VIEW products_search_v AS
    SELECT p.id, p.slug, p.title, p.description, p.price_cents, p.currency,
           p.image_url, p.status, p.category_id, p.search_tsv
    FROM products p
    WHERE p.status = 'active';

  -- Chatbot & Support System Tables
  CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sellers_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    phone TEXT,
    whatsapp_business_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    eta_text TEXT, -- "mâine 14:00-18:00", "3-5 zile", etc.
    tracking TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'order_eta', -- 'order_eta', 'order_cancel', 'return_policy'
    state TEXT NOT NULL DEFAULT 'open', -- 'open', 'waiting_seller', 'answered', 'closed'
    last_message TEXT,
    assignee_seller_id UUID REFERENCES sellers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'customer', 'bot', 'seller'
    body TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'whatsapp', 'web', 'email'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  -- Indexes for chatbot tables
  CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
  CREATE INDEX IF NOT EXISTS idx_sellers_extended_seller_id ON sellers_extended(seller_id);
  CREATE INDEX IF NOT EXISTS idx_orders_extended_order_id ON orders_extended(order_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
  CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`;

