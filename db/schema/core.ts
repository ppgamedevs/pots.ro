import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex, boolean, check, decimal, varchar, customType, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export { settings } from './settings';

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return 'bytea';
  },
});

// Enums
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'packed', 'shipped', 'delivered', 'canceled', 'refunded', 'return_requested', 'return_approved', 'returned']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'paid', 'failed']);
export const refundStatusEnum = pgEnum('refund_status', ['pending', 'processing', 'refunded', 'failed']);
export const ledgerTypeEnum = pgEnum('ledger_type', ['charge', 'commission', 'payout', 'refund', 'recovery']);
export const promotionTypeEnum = pgEnum('promotion_type', ['banner', 'discount']);
export const sellerApplicationStatusEnum = pgEnum('seller_application_status', ['received','in_review','need_info','approved','rejected']);
export const sellerStatusEnum = pgEnum('seller_status', ['onboarding','active','suspended']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);

export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['open', 'in_progress', 'waiting_on_seller', 'resolved', 'closed']);
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority', ['low', 'normal', 'high', 'urgent']);

// Content / CMS enums
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'scheduled', 'archived']);

// Admin alerts enums
export const alertStatusEnum = pgEnum('alert_status', ['open', 'acknowledged', 'resolved', 'snoozed']);
export const alertSeverityEnum = pgEnum('alert_severity', ['low', 'medium', 'high', 'critical']);

// Users table for passwordless auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  displayId: text("display_id").unique(), // Unique display ID for user greeting
  password: text("password"), // For password-based auth
  role: text("role").notNull().default("buyer").$type<'buyer' | 'seller' | 'admin' | 'support'>(),
  status: userStatusEnum("status").notNull().default('active'),
  permissions: jsonb("permissions").$type<string[]>(),
  rateLimitBypass: boolean("rate_limit_bypass").notNull().default(false),
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
  verifiedBadge: boolean("verified_badge").notNull().default(false),
  cuiValidatedAt: timestamp("cui_validated_at", { withTimezone: true }),
  ibanValidatedAt: timestamp("iban_validated_at", { withTimezone: true }),
  kycReverificationRequestedAt: timestamp("kyc_reverification_requested_at", { withTimezone: true }),
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

// Seller KYC documents (encrypted at rest; served only via authorized endpoints)
export const sellerKycDocuments = pgTable(
  'seller_kyc_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
    docType: text('doc_type').notNull(), // e.g. company_registration | iban_proof | id_doc
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    encryptedData: bytea('encrypted_data').notNull(),
    encryptionIv: bytea('encryption_iv').notNull(),
    encryptionTag: bytea('encryption_tag').notNull(),
    status: text('status').notNull().default('uploaded').$type<'uploaded' | 'approved' | 'rejected' | 'superseded'>(),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewMessage: text('review_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sellerKycDocumentsSellerIdx: index('seller_kyc_documents_seller_idx').on(table.sellerId),
    sellerKycDocumentsTypeIdx: index('seller_kyc_documents_type_idx').on(table.sellerId, table.docType),
    sellerKycDocumentsStatusIdx: index('seller_kyc_documents_status_idx').on(table.sellerId, table.status),
    sellerKycDocumentsCreatedIdx: index('seller_kyc_documents_created_idx').on(table.sellerId, table.createdAt),
  })
);

// Seller page versions (draft/publish history + rollback)
export const sellerPageVersions = pgTable(
  'seller_page_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: text('status').notNull().default('draft').$type<'draft' | 'published'>(),
    aboutMd: text('about_md'),
    seoTitle: text('seo_title'),
    seoDesc: text('seo_desc'),
    logoUrl: text('logo_url'),
    bannerUrl: text('banner_url'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    meta: jsonb('meta'),
  },
  (table) => ({
    sellerPageVersionsSellerIdx: index('seller_page_versions_seller_idx').on(table.sellerId),
    sellerPageVersionsVersionIdx: uniqueIndex('seller_page_versions_seller_version_uq').on(table.sellerId, table.version),
    sellerPageVersionsStatusIdx: index('seller_page_versions_status_idx').on(table.sellerId, table.status),
    sellerPageVersionsPublishedIdx: index('seller_page_versions_published_idx').on(table.sellerId, table.publishedAt),
  })
);

// Content authors (blog/help)
export const contentAuthors = pgTable(
  'content_authors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    email: text('email'),
    avatarUrl: text('avatar_url'),
    bioMd: text('bio_md'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contentAuthorsSlugIdx: index('content_authors_slug_idx').on(table.slug),
    contentAuthorsActiveIdx: index('content_authors_active_idx').on(table.isActive),
  })
);

// Blog posts (published snapshot + workflow)
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    slugLocked: boolean('slug_locked').notNull().default(false),
    authorId: uuid('author_id').references(() => contentAuthors.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    coverUrl: text('cover_url'),
    bodyMd: text('body_md'),
    seoTitle: text('seo_title'),
    seoDesc: text('seo_desc'),
    status: contentStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    blogPostsSlugIdx: index('blog_posts_slug_idx').on(table.slug),
    blogPostsStatusIdx: index('blog_posts_status_idx').on(table.status),
    blogPostsAuthorIdx: index('blog_posts_author_idx').on(table.authorId),
    blogPostsPublishedIdx: index('blog_posts_published_idx').on(table.publishedAt),
    blogPostsScheduledIdx: index('blog_posts_scheduled_idx').on(table.scheduledAt),
  })
);

// Blog post versions (draft/publish history + rollback)
export const blogPostVersions = pgTable(
  'blog_post_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: text('status').notNull().default('draft').$type<'draft' | 'published'>(),
    authorId: uuid('author_id').references(() => contentAuthors.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    coverUrl: text('cover_url'),
    bodyMd: text('body_md'),
    seoTitle: text('seo_title'),
    seoDesc: text('seo_desc'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    meta: jsonb('meta'),
  },
  (table) => ({
    blogPostVersionsPostIdx: index('blog_post_versions_post_idx').on(table.postId),
    blogPostVersionsVersionUq: uniqueIndex('blog_post_versions_post_version_uq').on(table.postId, table.version),
    blogPostVersionsStatusIdx: index('blog_post_versions_status_idx').on(table.postId, table.status),
    blogPostVersionsPublishedIdx: index('blog_post_versions_published_idx').on(table.postId, table.publishedAt),
  })
);

// Static pages (legal/help pages managed in admin)
export const staticPages = pgTable(
  'static_pages',
  {
    key: text('key').primaryKey(), // e.g. 'termeni' | 'confidentialitate'
    title: text('title').notNull(),
    bodyMd: text('body_md'),
    status: contentStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    staticPagesStatusIdx: index('static_pages_status_idx').on(table.status),
    staticPagesPublishedIdx: index('static_pages_published_idx').on(table.publishedAt),
  })
);

export const staticPageVersions = pgTable(
  'static_page_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageKey: text('page_key').notNull().references(() => staticPages.key, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: text('status').notNull().default('draft').$type<'draft' | 'published'>(),
    title: text('title').notNull(),
    bodyMd: text('body_md'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    meta: jsonb('meta'),
  },
  (table) => ({
    staticPageVersionsPageIdx: index('static_page_versions_page_idx').on(table.pageKey),
    staticPageVersionsUq: uniqueIndex('static_page_versions_page_version_uq').on(table.pageKey, table.version),
    staticPageVersionsStatusIdx: index('static_page_versions_status_idx').on(table.pageKey, table.status),
    staticPageVersionsPublishedIdx: index('static_page_versions_published_idx').on(table.pageKey, table.publishedAt),
  })
);

// Help center categories
export const helpCategories = pgTable(
  'help_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    helpCategoriesSlugIdx: index('help_categories_slug_idx').on(table.slug),
    helpCategoriesActiveIdx: index('help_categories_active_idx').on(table.isActive),
  })
);

// Help center articles (published snapshot)
export const helpArticles = pgTable(
  'help_articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').notNull().references(() => helpCategories.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    slugLocked: boolean('slug_locked').notNull().default(false),
    title: text('title').notNull(),
    summary: text('summary'),
    bodyMd: text('body_md'),
    status: contentStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    helpArticlesCategoryIdx: index('help_articles_category_idx').on(table.categoryId),
    helpArticlesSlugUq: uniqueIndex('help_articles_category_slug_uq').on(table.categoryId, table.slug),
    helpArticlesStatusIdx: index('help_articles_status_idx').on(table.status),
    helpArticlesPublishedIdx: index('help_articles_published_idx').on(table.publishedAt),
  })
);

export const helpArticleVersions = pgTable(
  'help_article_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id').notNull().references(() => helpArticles.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: text('status').notNull().default('draft').$type<'draft' | 'published'>(),
    categoryId: uuid('category_id').references(() => helpCategories.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    bodyMd: text('body_md'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    meta: jsonb('meta'),
  },
  (table) => ({
    helpArticleVersionsArticleIdx: index('help_article_versions_article_idx').on(table.articleId),
    helpArticleVersionsUq: uniqueIndex('help_article_versions_article_version_uq').on(table.articleId, table.version),
    helpArticleVersionsPublishedIdx: index('help_article_versions_published_idx').on(table.articleId, table.publishedAt),
  })
);

export const helpArticleTags = pgTable(
  'help_article_tags',
  {
    articleId: uuid('article_id').notNull().references(() => helpArticles.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    helpArticleTagsArticleIdx: index('help_article_tags_article_idx').on(table.articleId),
    helpArticleTagsTagIdx: index('help_article_tags_tag_idx').on(table.tag),
    helpArticleTagsUq: uniqueIndex('help_article_tags_article_tag_uq').on(table.articleId, table.tag),
  })
);

// Minimal Help Center analytics/events
export const helpAnalyticsEvents = pgTable(
  'help_analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: text('event_type').notNull().$type<'view' | 'search' | 'feedback'>(),
    articleId: uuid('article_id').references(() => helpArticles.id, { onDelete: 'set null' }),
    query: text('query'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: text('session_id'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    helpAnalyticsEventsTypeIdx: index('help_analytics_events_type_idx').on(table.eventType),
    helpAnalyticsEventsArticleIdx: index('help_analytics_events_article_idx').on(table.articleId),
    helpAnalyticsEventsCreatedIdx: index('help_analytics_events_created_idx').on(table.createdAt),
  })
);

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

// Seller application status events (audit trail)
export const sellerApplicationStatusEvents = pgTable(
  "seller_application_status_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").notNull().references(() => sellerApplications.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    fromStatus: sellerApplicationStatusEnum("from_status").notNull(),
    toStatus: sellerApplicationStatusEnum("to_status").notNull(),
    publicMessage: text("public_message"),
    internalMessage: text("internal_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sellerAppStatusEventsAppIdx: index("seller_app_status_events_app_idx").on(table.applicationId),
    sellerAppStatusEventsCreatedIdx: index("seller_app_status_events_created_idx").on(table.applicationId, table.createdAt),
    sellerAppStatusEventsActorIdx: index("seller_app_status_events_actor_idx").on(table.actorId),
  })
);

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
  slugLocked: boolean("slug_locked").notNull().default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoriesParentIdx: index("categories_parent_idx").on(table.parentId),
  categoriesSlugIdx: index("categories_slug_idx").on(table.slug),
}));

// Category redirects (for slug lock + merge)
export const categoryRedirects = pgTable(
  'category_redirects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromSlug: text('from_slug').notNull().unique(),
    toSlug: text('to_slug').notNull(),
    reason: text('reason'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryRedirectsFromIdx: index('category_redirects_from_idx').on(table.fromSlug),
    categoryRedirectsToIdx: index('category_redirects_to_idx').on(table.toSlug),
  })
);

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
  featured: boolean('featured').notNull().default(false),
  seoTitle: text('seo_title'),
  seoDesc: text('seo_desc'),
  attributes: jsonb("attributes").notNull().default({}),
  searchTsv: text("search_tsv"), // tsvector column (converted in migration)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxProductsSlug: index("idx_products_slug").on(table.slug),
  idxProductsStatus: index("idx_products_status").on(table.status),
  idxProductsSeller: index("idx_products_seller").on(table.sellerId),
  idxProductsFeatured: index('idx_products_featured').on(table.featured),
}));

// Admin-enforced locks to prevent silent manipulation of price/stock (and optionally all updates).
export const productLocks = pgTable(
  'product_locks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull().$type<'price' | 'stock' | 'all'>(),
    lockedUntil: timestamp('locked_until', { withTimezone: true }).notNull(),
    reason: text('reason').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
    revokedReason: text('revoked_reason'),
  },
  (table) => ({
    productLocksProductIdx: index('product_locks_product_idx').on(table.productId),
    productLocksUntilIdx: index('product_locks_until_idx').on(table.lockedUntil),
  })
);

// Product images table
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  isHidden: boolean('is_hidden').notNull().default(false),
  isBlurred: boolean('is_blurred').notNull().default(false),
  reportCount: integer('report_count').notNull().default(0),
  moderationStatus: text('moderation_status').notNull().default('approved').$type<'approved' | 'hidden' | 'blurred' | 'flagged'>(),
  moderatedBy: uuid('moderated_by').references(() => users.id, { onDelete: 'set null' }),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productImagesProductIdx: index("product_images_product_idx").on(table.productId),
  productImagesStatusIdx: index('product_images_status_idx').on(table.moderationStatus),
  productImagesReportsIdx: index('product_images_reports_idx').on(table.reportCount),
}));

// Generic admin audit log (catalog, moderation, search tuning, etc.)
export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorRole: text('actor_role'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    message: text('message'),
    meta: jsonb('meta'),
    prevHash: text('prev_hash'),
    entryHash: text('entry_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adminAuditLogsEntityIdx: index('admin_audit_logs_entity_idx').on(table.entityType, table.entityId),
    adminAuditLogsCreatedIdx: index('admin_audit_logs_created_idx').on(table.createdAt),
    adminAuditLogsActorIdx: index('admin_audit_logs_actor_idx').on(table.actorId),
  })
);

// Timeboxed grants for revealing masked PII in admin (reason-required)
export const adminPiiGrants = pgTable(
  'admin_pii_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    fields: jsonb('fields').notNull().$type<string[]>(),
    reason: text('reason').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adminPiiGrantsActorIdx: index('admin_pii_grants_actor_idx').on(table.actorId),
    adminPiiGrantsEntityIdx: index('admin_pii_grants_entity_idx').on(table.entityType, table.entityId),
    adminPiiGrantsExpiresIdx: index('admin_pii_grants_expires_idx').on(table.expiresAt),
  })
);

// Search tuning (admin-only)
export const searchQueryLogs = pgTable(
  'search_query_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    q: text('q').notNull(),
    resultsCount: integer('results_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    searchQueryLogsCreatedIdx: index('search_query_logs_created_idx').on(table.createdAt),
    searchQueryLogsQIdx: index('search_query_logs_q_idx').on(table.q),
  })
);

export const searchSynonyms = pgTable(
  'search_synonyms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term: text('term').notNull().unique(),
    synonyms: jsonb('synonyms').notNull().$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    searchSynonymsTermIdx: index('search_synonyms_term_idx').on(table.term),
  })
);

export const searchBoosts = pgTable(
  'search_boosts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term: text('term').notNull().unique(),
    boost: integer('boost').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    searchBoostsTermIdx: index('search_boosts_term_idx').on(table.term),
  })
);

export const searchStopwords = pgTable(
  'search_stopwords',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term: text('term').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    searchStopwordsTermIdx: index('search_stopwords_term_idx').on(table.term),
  })
);

export const searchTuningSettings = pgTable(
  'search_tuning_settings',
  {
    id: text('id').primaryKey(), // singleton: 'default'
    enabled: boolean('enabled').notNull().default(false),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    searchTuningSettingsEnabledIdx: index('search_tuning_settings_enabled_idx').on(table.enabled),
  })
);

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
  meta: jsonb("meta").$type<Record<string, any>>(),
  approvalStatus: text("approval_status").notNull().default('approved').$type<'draft' | 'pending_approval' | 'approved' | 'rejected' | 'disabled'>(),
  approvalRequestedBy: uuid("approval_requested_by").references(() => users.id, { onDelete: "set null" }),
  approvalRequestedAt: timestamp("approval_requested_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  changeNote: text("change_note"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  promotionsSellerIdx: index("promotions_seller_idx").on(table.sellerId),
  promotionsActiveIdx: index("promotions_active_idx").on(table.active),
  promotionsTypeIdx: index("promotions_type_idx").on(table.type),
  promotionsTargetIdx: index("promotions_target_idx").on(table.targetCategorySlug, table.targetProductId),
}));

export const promotionVersions = pgTable('promotion_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  promotionVersionsPromotionIdx: index('promotion_versions_promotion_idx').on(table.promotionId),
  promotionVersionsVersionIdx: index('promotion_versions_version_idx').on(table.promotionId, table.version),
}));

export const assetScanJobs = pgTable('asset_scan_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  blobPath: text('blob_path').notNull().unique(),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('pending').$type<'pending' | 'clean' | 'quarantined' | 'failed'>(),
  result: jsonb('result'),
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetScanJobsStatusIdx: index('asset_scan_jobs_status_idx').on(table.status),
}));

// Affiliates (admin-managed; does not imply public coupon support)
export const affiliatePartners = pgTable('affiliate_partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active').$type<'active' | 'disabled'>(),
  contactEmail: text('contact_email'),
  websiteUrl: text('website_url'),
  defaultCommissionBps: integer('default_commission_bps').notNull().default(500),
  payoutNotes: text('payout_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliatePartnersStatusIdx: index('affiliate_partners_status_idx').on(table.status),
}));

export const affiliateCodes = pgTable('affiliate_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => affiliatePartners.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('active').$type<'active' | 'disabled'>(),
  commissionBps: integer('commission_bps'),
  maxUses: integer('max_uses'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliateCodesPartnerIdx: index('affiliate_codes_partner_idx').on(table.partnerId),
  affiliateCodesStatusIdx: index('affiliate_codes_status_idx').on(table.status),
}));

export const affiliateAttributions = pgTable('affiliate_attributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeId: uuid('code_id').notNull().references(() => affiliateCodes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  ipHash: text('ip_hash'),
  userAgentHash: text('user_agent_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliateAttributionsCodeIdx: index('affiliate_attributions_code_idx').on(table.codeId),
  affiliateAttributionsOrderIdx: index('affiliate_attributions_order_idx').on(table.orderId),
  affiliateAttributionsUserIdx: index('affiliate_attributions_user_idx').on(table.userId),
}));

export const affiliateCommissionEvents = pgTable('affiliate_commission_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => affiliatePartners.id, { onDelete: 'cascade' }),
  attributionId: uuid('attribution_id').references(() => affiliateAttributions.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull().default('pending').$type<'pending' | 'approved' | 'void' | 'paid'>(),
  reason: text('reason'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliateCommissionEventsPartnerIdx: index('affiliate_commission_events_partner_idx').on(table.partnerId),
  affiliateCommissionEventsOrderIdx: index('affiliate_commission_events_order_idx').on(table.orderId),
  affiliateCommissionEventsStatusIdx: index('affiliate_commission_events_status_idx').on(table.status),
}));

export const affiliatePayouts = pgTable('affiliate_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => affiliatePartners.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull().default('draft').$type<'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid'>(),
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }),
  requestedAt: timestamp('requested_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliatePayoutsPartnerIdx: index('affiliate_payouts_partner_idx').on(table.partnerId),
  affiliatePayoutsStatusIdx: index('affiliate_payouts_status_idx').on(table.status),
}));

export const affiliateFraudRules = pgTable('affiliate_fraud_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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

// Append-only consent proof registry (minimal exposure: stores hashes + masked hints; not full email)
export const gdprConsentEvents = pgTable(
  'gdpr_consent_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailHash: text('email_hash').notNull(),
    emailDomain: text('email_domain'),
    emailMasked: text('email_masked'),
    consentType: text('consent_type').notNull().$type<'necessary' | 'all'>(),
    legalBasis: text('legal_basis')
      .notNull()
      .$type<'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation' | 'other'>(),
    source: text('source').notNull().$type<'user' | 'admin' | 'migration'>(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    ip: text('ip'),
    userAgent: text('ua'),
    policyVersion: text('policy_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    gdprConsentEventsEmailHashIdx: index('gdpr_consent_events_email_hash_idx').on(table.emailHash),
    gdprConsentEventsCreatedIdx: index('gdpr_consent_events_created_idx').on(table.createdAt),
  })
);

// DSAR (data subject access request) tracking (email-based + verified link)
export const gdprDsrRequests = pgTable(
  'gdpr_dsr_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull().$type<'export' | 'delete'>(),
    status: text('status')
      .notNull()
      .$type<'pending_verification' | 'open' | 'in_progress' | 'fulfilled' | 'rejected' | 'cancelled'>(),
    email: text('email').notNull(),
    emailHash: text('email_hash').notNull(),
    emailDomain: text('email_domain'),
    emailMasked: text('email_masked'),
    requestedIp: text('requested_ip'),
    requestedUserAgent: text('requested_ua'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    verifyExpiresAt: timestamp('verify_expires_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    meta: jsonb('meta'),
  },
  (table) => ({
    gdprDsrRequestsEmailHashIdx: index('gdpr_dsr_requests_email_hash_idx').on(table.emailHash),
    gdprDsrRequestsStatusIdx: index('gdpr_dsr_requests_status_idx').on(table.status),
    gdprDsrRequestsRequestedAtIdx: index('gdpr_dsr_requests_requested_at_idx').on(table.requestedAt),
  })
);

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

// Reserved names for username/displayId validation
export const reservedNames = pgTable("reserved_names", {
  name: text("name").primaryKey(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Rate limits persistence (replaces in-memory store)
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: bigint("reset_at", { mode: "number" }).notNull(),
}, (table) => ({
  resetAtIdx: index("rate_limits_reset_at_idx").on(table.resetAt),
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

// Seller actions table for tracking admin actions (suspend/reactivate/platform/profile/impersonation)
export const sellerActions = pgTable(
  "seller_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
    action: text("action")
      .notNull()
      .$type<
        | 'suspend'
        | 'reactivate'
        | 'set_platform'
        | 'update_profile'
        | 'reset_onboarding'
        | 'impersonate_start'
        | 'impersonate_end'
      >(),
    message: text("message"),
    meta: jsonb("meta"),
    adminUserId: uuid("admin_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sellerActionsSellerIdIdx: index("seller_actions_seller_id_idx").on(table.sellerId),
    sellerActionsCreatedIdx: index("seller_actions_created_idx").on(table.createdAt),
  })
);

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
  errorMessage: text("error_message"), // last issuing error message (if status=error)
  voidedBy: uuid("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  meta: jsonb("meta").$type<Record<string, any>>(), // extra provider metadata
  // Pentru factura vânzătorului (când type = 'seller')
  sellerInvoiceNumber: text("seller_invoice_number"), // Numărul facturii emise de vânzător
  uploadedBy: uuid("uploaded_by").references(() => users.id), // User-ul care a încărcat factura
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }), // Când a fost încărcată
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  invoicesOrderUnique: uniqueIndex("invoices_order_unique").on(table.orderId, table.type), // Permite multiple facturi per comandă (comision + seller)
  invoicesCreatedIdx: index("invoices_created_idx").on(table.createdAt),
  invoicesStatusIdx: index("invoices_status_idx").on(table.status),
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

// Communication broadcasts (admin-governed announcements to segments)
export const communicationBroadcasts = pgTable(
  'communication_broadcasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').notNull().$type<'system' | 'announcement' | 'marketing'>().default('announcement'),
    channel: text('channel').notNull().$type<'email'>().default('email'),
    status: text('status')
      .notNull()
      .$type<'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'rejected' | 'failed'>()
      .default('draft'),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    html: text('html').notNull(),
    text: text('text'),
    fromEmail: text('from_email'),
    segment: jsonb('segment'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'set null' }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    sendStartedAt: timestamp('send_started_at', { withTimezone: true }),
    sendCompletedAt: timestamp('send_completed_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    commBroadcastsStatusIdx: index('comm_broadcasts_status_idx').on(table.status, table.scheduledAt),
    commBroadcastsCreatedIdx: index('comm_broadcasts_created_idx').on(table.createdAt),
  })
);

export const communicationBroadcastRecipients = pgTable(
  'communication_broadcast_recipients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broadcastId: uuid('broadcast_id').notNull().references(() => communicationBroadcasts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    status: text('status')
      .notNull()
      .$type<'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'suppressed' | 'failed'>()
      .default('pending'),
    provider: text('provider').notNull().default('resend'),
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    commBroadcastRecipientsBroadcastIdx: index('comm_broadcast_recipients_broadcast_idx').on(table.broadcastId, table.status),
    commBroadcastRecipientsEmailIdx: index('comm_broadcast_recipients_email_idx').on(table.email),
    commBroadcastRecipientsProviderMsgIdx: index('comm_broadcast_recipients_provider_msg_idx').on(table.providerMessageId),
    commBroadcastRecipientsProviderMsgUq: uniqueIndex('comm_broadcast_recipients_provider_msg_uq')
      .on(table.provider, table.providerMessageId)
      .where(sql`${table.providerMessageId} is not null`),
    commBroadcastRecipientsUnique: uniqueIndex('comm_broadcast_recipient_unique').on(table.broadcastId, table.email),
  })
);

// Email suppression list (deliverability + compliance)
export const emailSuppressions = pgTable(
  'email_suppressions',
  {
    email: text('email').primaryKey(),
    reason: text('reason').notNull().$type<'bounce' | 'complaint' | 'manual' | 'unsubscribe'>(),
    source: text('source').notNull().$type<'resend' | 'admin' | 'user'>(),
    note: text('note'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailSuppressionsCreatedIdx: index('email_suppressions_created_idx').on(table.createdAt),
    emailSuppressionsRevokedIdx: index('email_suppressions_revoked_idx').on(table.revokedAt),
  })
);

// Provider deliverability events (from Resend webhooks)
export const emailDeliverabilityEvents = pgTable(
  'email_deliverability_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('resend'),
    eventType: text('event_type')
      .notNull()
      .$type<'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'failed' | 'unknown'>(),
    providerMessageId: text('provider_message_id'),
    email: text('email'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    broadcastId: uuid('broadcast_id').references(() => communicationBroadcasts.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailDeliverabilityTypeIdx: index('email_deliverability_type_idx').on(table.eventType, table.occurredAt),
    emailDeliverabilityEmailIdx: index('email_deliverability_email_idx').on(table.email),
    emailDeliverabilityProviderMsgIdx: index('email_deliverability_provider_msg_idx').on(table.providerMessageId),
    emailDeliverabilityDedupeUq: uniqueIndex('email_deliverability_events_dedupe_uq')
      .on(table.provider, table.providerMessageId, table.eventType)
      .where(sql`${table.providerMessageId} is not null`),
  })
);

// Feature flags (minimal rollout + targeting)
export const featureFlags = pgTable(
  'feature_flags',
  {
    key: text('key').primaryKey(),
    enabled: boolean('enabled').notNull().default(false),
    rolloutPct: integer('rollout_pct').notNull().default(0),
    segments: jsonb('segments'),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    featureFlagsUpdatedIdx: index('feature_flags_updated_idx').on(table.updatedAt),
  })
);

// Managed email templates (OTP/welcome only, versioned)
export const managedEmailTemplates = pgTable(
  'managed_email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateKey: text('template_key').notNull(),
    version: integer('version').notNull(),
    subject: text('subject').notNull(),
    html: text('html').notNull(),
    status: text('status').notNull().default('draft').$type<'draft' | 'active' | 'archived'>(),
    note: text('note'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    activatedBy: uuid('activated_by').references(() => users.id, { onDelete: 'set null' }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
  },
  (table) => ({
    managedEmailTemplatesKeyIdx: index('managed_email_templates_key_idx').on(table.templateKey),
    managedEmailTemplatesStatusIdx: index('managed_email_templates_status_idx').on(table.templateKey, table.status),
    managedEmailTemplatesKeyVersionUq: uniqueIndex('managed_email_templates_key_version_uq').on(table.templateKey, table.version),
  })
);

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

// Commission rates (versioned, effective date, 2-person approval handled via API)
export const commissionRates = pgTable(
  'commission_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // null = default platform rate
    sellerId: uuid('seller_id').references(() => sellers.id, { onDelete: 'cascade' }),
    pctBps: integer('pct_bps').notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('pending').$type<'pending' | 'approved' | 'rejected' | 'superseded'>(),
    requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    commissionRatesSellerEffectiveIdx: index('commission_rates_seller_effective_idx').on(table.sellerId, table.effectiveAt),
    commissionRatesStatusEffectiveIdx: index('commission_rates_status_effective_idx').on(table.status, table.effectiveAt),
  })
);

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

// ============================================================================
// DEVELOPER / API KEYS / OUTBOUND WEBHOOKS SCHEMA
// ============================================================================

// Developer API key status enum
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked', 'expired']);

// Developer API keys (hashed; plaintext shown once at creation)
export const developerApiKeys = pgTable(
  "developer_api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(), // first 8 chars for identification (e.g., "pk_live_a1b2c3d4")
    keyHash: text("key_hash").notNull(), // scrypt hash of the full key
    scopes: jsonb("scopes").notNull().$type<string[]>().default([]),
    status: apiKeyStatusEnum("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    lastUsedIp: text("last_used_ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: uuid("revoked_by").references(() => users.id, { onDelete: "set null" }),
    revokedReason: text("revoked_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    developerApiKeysPrefixIdx: index("developer_api_keys_prefix_idx").on(table.prefix),
    developerApiKeysStatusIdx: index("developer_api_keys_status_idx").on(table.status),
    developerApiKeysCreatedByIdx: index("developer_api_keys_created_by_idx").on(table.createdBy),
    developerApiKeysLastUsedIdx: index("developer_api_keys_last_used_idx").on(table.lastUsedAt),
  })
);

// Developer webhook endpoint status enum
export const webhookEndpointStatusEnum = pgEnum('webhook_endpoint_status', ['active', 'paused', 'disabled']);

// Developer webhook endpoints (outbound)
export const developerWebhookEndpoints = pgTable(
  "developer_webhook_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    status: webhookEndpointStatusEnum("status").notNull().default("active"),
    secretHash: text("secret_hash").notNull(), // HMAC signing secret (hashed for storage; plaintext shown once)
    secretPrefix: text("secret_prefix").notNull(), // first 8 chars for identification
    secretCreatedAt: timestamp("secret_created_at", { withTimezone: true }).defaultNow().notNull(),
    events: jsonb("events").notNull().$type<string[]>().default([]), // subscribed event types
    headers: jsonb("headers").$type<Record<string, string>>(), // custom headers to include
    retryPolicy: jsonb("retry_policy").$type<{ maxAttempts: number; backoffMs: number }>().default({ maxAttempts: 3, backoffMs: 1000 }),
    lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
    lastDeliveryStatus: text("last_delivery_status").$type<"success" | "failed">(),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    disabledReason: text("disabled_reason"),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    developerWebhookEndpointsStatusIdx: index("developer_webhook_endpoints_status_idx").on(table.status),
    developerWebhookEndpointsCreatedByIdx: index("developer_webhook_endpoints_created_by_idx").on(table.createdBy),
    developerWebhookEndpointsUrlIdx: index("developer_webhook_endpoints_url_idx").on(table.url),
  })
);

// Outbound webhook delivery log + retry queue
export const developerWebhookDeliveries = pgTable(
  "developer_webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpointId: uuid("endpoint_id").notNull().references(() => developerWebhookEndpoints.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    eventId: text("event_id").notNull(), // deduplication key
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending").$type<"pending" | "success" | "failed" | "cancelled">(),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastStatusCode: integer("last_status_code"),
    lastError: text("last_error"),
    lastResponseBody: text("last_response_body"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    developerWebhookDeliveriesEndpointIdx: index("developer_webhook_deliveries_endpoint_idx").on(table.endpointId),
    developerWebhookDeliveriesStatusIdx: index("developer_webhook_deliveries_status_idx").on(table.status),
    developerWebhookDeliveriesEventIdx: index("developer_webhook_deliveries_event_idx").on(table.eventType),
    developerWebhookDeliveriesNextAttemptIdx: index("developer_webhook_deliveries_next_attempt_idx").on(table.nextAttemptAt).where(sql`status = 'pending'`),
    developerWebhookDeliveriesEventIdUq: uniqueIndex("developer_webhook_deliveries_event_id_uq").on(table.endpointId, table.eventId),
  })
);

// Backup runs table (restore points index; backup artifacts live in Vercel Blob)
export const backupRuns = pgTable(
  "backup_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull().default("ci").$type<"ci" | "manual" | "cron">(),
    status: text("status").notNull().default("success").$type<"requested" | "running" | "success" | "failed">(),
    backupPath: text("backup_path").unique(),
    metaPath: text("meta_path"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    checksumSha256: text("checksum_sha256"),
    environment: text("environment"),
    dbName: text("db_name"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    backupRunsCreatedIdx: index("backup_runs_created_idx").on(table.createdAt),
    backupRunsStatusIdx: index("backup_runs_status_idx").on(table.status),
    backupRunsSourceIdx: index("backup_runs_source_idx").on(table.source),
  })
);

// Admin alerts table for unified incident management
export const adminAlerts = pgTable("admin_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(), // 'webhook_failure', 'payment_error', 'stock_negative', 'seller_suspended', 'message_spike'
  type: text("type").notNull(), // sub-type e.g. 'netopia_timeout', 'stripe_declined'
  severity: alertSeverityEnum("severity").notNull().default("medium"),
  dedupeKey: text("dedupe_key").notNull(), // unique per open alert, e.g. 'stock:product:uuid'
  entityType: text("entity_type"), // 'order', 'product', 'seller', 'webhook', etc.
  entityId: text("entity_id"), // UUID or external ref
  title: text("title").notNull(),
  details: jsonb("details").default({}), // extra context (error message, counts, etc.)
  status: alertStatusEnum("status").notNull().default("open"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, { onDelete: "set null" }),
  linkedTicketId: uuid("linked_ticket_id").references(() => supportTickets.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  adminAlertsDedupeKeyStatusIdx: uniqueIndex("admin_alerts_dedupe_key_status_idx").on(table.dedupeKey).where(sql`status IN ('open', 'acknowledged', 'snoozed')`),
  adminAlertsStatusIdx: index("admin_alerts_status_idx").on(table.status),
  adminAlertsSeverityIdx: index("admin_alerts_severity_idx").on(table.severity),
  adminAlertsSourceIdx: index("admin_alerts_source_idx").on(table.source),
  adminAlertsAssignedIdx: index("admin_alerts_assigned_idx").on(table.assignedToUserId),
  adminAlertsCreatedIdx: index("admin_alerts_created_idx").on(table.createdAt),
}));

// ============================================================================
// SUPPORT CONSOLE SCHEMA
// ============================================================================

// Enums for support console
export const supportThreadStatusEnum = pgEnum('support_thread_status', ['open', 'assigned', 'waiting', 'resolved', 'closed']);
export const supportThreadSourceEnum = pgEnum('support_thread_source', ['buyer_seller', 'seller_support', 'chatbot', 'whatsapp']);
export const messageModerationStatusEnum = pgEnum('message_moderation_status', ['visible', 'hidden', 'redacted', 'deleted']);

// Unified support threads index table (Option B - single table aggregating all sources)
export const supportThreads = pgTable("support_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: supportThreadSourceEnum("source").notNull(), // 'buyer_seller', 'seller_support', 'chatbot', 'whatsapp'
  sourceId: uuid("source_id").notNull(), // conversation.id, ticket.id, etc.
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "set null" }),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
  status: supportThreadStatusEnum("status").notNull().default("open"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  priority: supportTicketPriorityEnum("priority").notNull().default("normal"),
  subject: text("subject"), // derived from first message or ticket title
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessagePreview: text("last_message_preview"), // truncated last message
  messageCount: integer("message_count").notNull().default(0),
  slaDeadline: timestamp("sla_deadline", { withTimezone: true }),
  slaBreach: boolean("sla_breach").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  supportThreadsSourceIdx: index("support_threads_source_idx").on(table.source, table.sourceId),
  supportThreadsSourceIdUnique: uniqueIndex("support_threads_source_id_unique").on(table.source, table.sourceId),
  supportThreadsStatusIdx: index("support_threads_status_idx").on(table.status),
  supportThreadsAssignedIdx: index("support_threads_assigned_idx").on(table.assignedToUserId),
  supportThreadsOrderIdx: index("support_threads_order_idx").on(table.orderId),
  supportThreadsSellerIdx: index("support_threads_seller_idx").on(table.sellerId),
  supportThreadsBuyerIdx: index("support_threads_buyer_idx").on(table.buyerId),
  supportThreadsLastMessageIdx: index("support_threads_last_message_idx").on(table.lastMessageAt),
  supportThreadsSlaDeadlineIdx: index("support_threads_sla_deadline_idx").on(table.slaDeadline).where(sql`sla_breach = false AND status NOT IN ('resolved', 'closed')`),
  supportThreadsPriorityStatusIdx: index("support_threads_priority_status_idx").on(table.priority, table.status),
}));

// Tags for support threads (for categorization/filtering)
export const supportThreadTags = pgTable("support_thread_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => supportThreads.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  supportThreadTagsThreadIdx: index("support_thread_tags_thread_idx").on(table.threadId),
  supportThreadTagsTagIdx: index("support_thread_tags_tag_idx").on(table.tag),
  supportThreadTagsUnique: uniqueIndex("support_thread_tags_unique").on(table.threadId, table.tag),
}));

// Thread-level internal notes (staff-only; never exposed to users)
export const supportInternalNotes = pgTable("support_internal_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => supportThreads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  supportInternalNotesThreadIdx: index("support_internal_notes_thread_idx").on(table.threadId),
}));

// Messages for unified support threads (used for chatbot/whatsapp threads)
export const supportThreadMessages = pgTable(
  "support_thread_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").notNull().references(() => supportThreads.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    authorRole: text("author_role").notNull(), // 'customer' | 'support' | 'bot' | 'system'
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportThreadMessagesThreadIdx: index("support_thread_messages_thread_idx").on(table.threadId),
    supportThreadMessagesCreatedIdx: index("support_thread_messages_created_idx").on(table.threadId, table.createdAt),
  })
);

// Message moderation overlay table (keeps original message intact)
export const messageModeration = pgTable("message_moderation", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").notNull().unique(), // references messages.id but without FK for flexibility
  status: messageModerationStatusEnum("status").notNull().default("visible"),
  redactedBody: text("redacted_body"), // displayed body after redaction (original kept in messages)
  reason: text("reason"), // why hidden/redacted/deleted
  moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  // For internal notes
  isInternalNote: boolean("is_internal_note").notNull().default(false),
  internalNoteBody: text("internal_note_body"), // admin-only note attached to this message
  internalNoteByUserId: uuid("internal_note_by_user_id").references(() => users.id, { onDelete: "set null" }),
  internalNoteAt: timestamp("internal_note_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  messageModerationMessageIdx: uniqueIndex("message_moderation_message_idx").on(table.messageId),
  messageModerationStatusIdx: index("message_moderation_status_idx").on(table.status).where(sql`status != 'visible'`),
  messageModerationModeratedByIdx: index("message_moderation_moderated_by_idx").on(table.moderatedByUserId),
}));

// Extended conversation flags (bypass/fraud detection)
export const conversationFlagsExtended = pgTable("conversation_flags_extended", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().unique().references(() => conversations.id, { onDelete: "cascade" }),
  fraudSuspected: boolean("fraud_suspected").notNull().default(false),
  fraudReason: text("fraud_reason"),
  fraudDetectedAt: timestamp("fraud_detected_at", { withTimezone: true }),
  fraudDetectedByUserId: uuid("fraud_detected_by_user_id").references(() => users.id, { onDelete: "set null" }),
  escalatedToUserId: uuid("escalated_to_user_id").references(() => users.id, { onDelete: "set null" }),
  escalatedAt: timestamp("escalated_at", { withTimezone: true }),
  escalationReason: text("escalation_reason"),
  evidenceJson: jsonb("evidence_json").default({}), // screenshots, logs, etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationFlagsExtConvIdx: uniqueIndex("conversation_flags_ext_conv_idx").on(table.conversationId),
  conversationFlagsExtFraudIdx: index("conversation_flags_ext_fraud_idx").on(table.fraudSuspected).where(sql`fraud_suspected = true`),
  conversationFlagsExtEscalatedIdx: index("conversation_flags_ext_escalated_idx").on(table.escalatedToUserId).where(sql`escalated_to_user_id IS NOT NULL`),
}));

// Chatbot queue for items awaiting handoff or review
export const chatbotQueue = pgTable("chatbot_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => supportThreads.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id"), // original chatbot conversation
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending").$type<'pending' | 'processing' | 'handed_off' | 'resolved' | 'rejected'>(),
  intent: text("intent"), // detected intent from chatbot
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // bot confidence score
  lastBotResponse: text("last_bot_response"),
  userQuery: text("user_query"), // last user message
  handoffReason: text("handoff_reason"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  promptInjectionSuspected: boolean("prompt_injection_suspected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chatbotQueueStatusIdx: index("chatbot_queue_status_idx").on(table.status),
  chatbotQueueThreadIdx: index("chatbot_queue_thread_idx").on(table.threadId),
  chatbotQueueAssignedIdx: index("chatbot_queue_assigned_idx").on(table.assignedToUserId),
  chatbotQueueUserIdx: index("chatbot_queue_user_idx").on(table.userId),
  chatbotQueuePendingIdx: index("chatbot_queue_pending_idx").on(table.createdAt).where(sql`status = 'pending'`),
}));

// WhatsApp message events (delivery tracking, template usage)
export const whatsappMessageEvents = pgTable("whatsapp_message_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  whatsappMessageId: text("whatsapp_message_id").notNull(), // Meta's message ID
  threadId: uuid("thread_id").references(() => supportThreads.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number"), // recipient phone (hashed/masked in prod)
  templateName: text("template_name"), // if sent via template
  direction: text("direction").notNull().$type<'inbound' | 'outbound'>(),
  status: text("status").notNull().$type<'sent' | 'delivered' | 'read' | 'failed' | 'received'>(),
  statusTimestamp: timestamp("status_timestamp", { withTimezone: true }),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  payloadJson: jsonb("payload_json").default({}), // redacted webhook payload
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  whatsappEventsMessageIdx: index("whatsapp_events_message_idx").on(table.whatsappMessageId),
  whatsappEventsThreadIdx: index("whatsapp_events_thread_idx").on(table.threadId),
  whatsappEventsStatusIdx: index("whatsapp_events_status_idx").on(table.status),
  whatsappEventsCreatedIdx: index("whatsapp_events_created_idx").on(table.createdAt),
  whatsappEventsPhoneIdx: index("whatsapp_events_phone_idx").on(table.phoneNumber),
}));

// Canned replies for support agents
export const supportCannedReplies = pgTable("support_canned_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category"), // 'greeting', 'closing', 'refund', 'shipping', etc.
  language: text("language").notNull().default("ro"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  supportCannedRepliesSlugIdx: uniqueIndex("support_canned_replies_slug_idx").on(table.slug),
  supportCannedRepliesCategoryIdx: index("support_canned_replies_category_idx").on(table.category),
  supportCannedRepliesActiveIdx: index("support_canned_replies_active_idx").on(table.isActive).where(sql`is_active = true`),
}));

// Support Moderation History - immutable audit trail for all moderation actions
export const supportModerationHistory = pgTable(
  "support_moderation_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Who: Actor information
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorName: text("actor_name"), // Cached name for display (user.name or "Bot" or "System")
    actorRole: text("actor_role").$type<"admin" | "support" | "bot" | "system">(),
    // What: Action details
    actionType: text("action_type").notNull().$type<
      | "message.hide"
      | "message.delete"
      | "message.redact"
      | "message.restore"
      | "message.addNote"
      | "message.redactPII"
      | "thread.statusChange"
      | "thread.priorityChange"
      | "thread.assign"
      | "thread.unassign"
      | "thread.escalate"
      | "thread.deescalate"
      | "user.block"
      | "user.unblock"
      | "other"
    >(),
    // Where: Entity information
    entityType: text("entity_type").notNull().$type<"message" | "thread" | "user" | "conversation">(),
    entityId: text("entity_id").notNull(), // UUID as text for flexibility
    threadId: uuid("thread_id").references(() => supportThreads.id, { onDelete: "set null" }), // For filtering by thread
    // Why: Reason and notes
    reason: text("reason"), // Predefined reason code (e.g., "spam", "harassment", "pii_exposure")
    note: text("note"), // Free-form note from moderator
    // Additional metadata
    metadata: jsonb("metadata").default({}), // Additional context (e.g., previous status, redacted patterns, etc.)
    // When: Timestamp (immutable, no updatedAt)
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supportModerationHistoryThreadIdx: index("support_moderation_history_thread_idx").on(table.threadId),
    supportModerationHistoryEntityIdx: index("support_moderation_history_entity_idx").on(table.entityType, table.entityId),
    supportModerationHistoryActorIdx: index("support_moderation_history_actor_idx").on(table.actorId),
    supportModerationHistoryActionIdx: index("support_moderation_history_action_idx").on(table.actionType),
    supportModerationHistoryCreatedIdx: index("support_moderation_history_created_idx").on(table.createdAt),
    supportModerationHistoryCompositeIdx: index("support_moderation_history_composite_idx").on(
      table.threadId,
      table.actionType,
      table.createdAt
    ),
  })
);

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

