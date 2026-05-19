import { pgTable, text, timestamp, boolean, integer, varchar, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // total available credits for the user
  credits: integer("credits").default(0).notNull(),
  // user role: 'admin' | 'user'
  role: text("role").default("user").notNull(),
  // current subscription plan
  planKey: text("plan_key").default("free"),
  // ban status
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Payment records (one-time purchases and subscription renewals)
export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  provider: varchar("provider", { length: 32 }).default("creem").notNull(),
  providerPaymentId: text("provider_payment_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // 'one_time' | 'subscription'
  planKey: varchar("plan_key", { length: 64 }),
  creditsGranted: integer("credits_granted").default(0).notNull(),
  raw: text("raw"), // store provider payload as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Active subscriptions
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  provider: varchar("provider", { length: 32 }).default("creem").notNull(),
  providerSubId: text("provider_sub_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  planKey: varchar("plan_key", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  raw: text("raw"), // store provider payload as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Credit ledger for auditability
export const creditLedger = pgTable("credit_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: varchar("reason", { length: 64 }).notNull(), // 'subscription_cycle' | 'one_time_pack' | 'adjustment' | 'chat_usage' | ...
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionCreditSchedule = pgTable(
  "subscription_credit_schedule",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" })
      .unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planKey: varchar("plan_key", { length: 64 }).notNull(),
    creditsPerGrant: integer("credits_per_grant").notNull(),
    intervalMonths: integer("interval_months").notNull(),
    grantsRemaining: integer("grants_remaining").notNull(),
    totalCreditsRemaining: integer("total_credits_remaining").notNull(),
    nextGrantAt: timestamp("next_grant_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => ({
    nextGrantIdx: index("subscription_credit_schedule_next_grant_idx").on(table.nextGrantAt),
  }),
);

// Chat sessions
export const chatSession = pgTable("chat_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  model: varchar("model", { length: 48 }).default("doubao-1-5-thinking-pro-250415").notNull(),
  totalMessages: integer("total_messages").default(0).notNull(),
  totalCreditsUsed: integer("total_credits_used").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Chat messages
export const chatMessage = pgTable("chat_message", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => chatSession.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  creditsUsed: integer("credits_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generation history for images and videos
export const generationHistory = pgTable("generation_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).notNull(), // 'image' | 'video'
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"), // For image-to-video generation
  resultUrl: text("result_url"), // Final result URL
  taskId: text("task_id"), // For async video generation tracking
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending, processing, completed, failed
  creditsUsed: integer("credits_used").default(0).notNull(),
  metadata: text("metadata"), // JSON string for additional data
  error: text("error"), // Error message if failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// Password reset tokens
export const passwordResetToken = pgTable("password_reset_token", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter subscriptions
export const newsletterSubscription = pgTable("newsletter_subscription", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active, unsubscribed
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const company = pgTable(
  "company",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: text("name").notNull(),
    logo: text("logo"),
    tagline: text("tagline"),
    description: text("description"),
    type: varchar("type", { length: 64 }).notNull(),
    domains: text("domains").default("").notNull(),
    foundedYear: integer("founded_year"),
    country: varchar("country", { length: 80 }),
    city: varchar("city", { length: 80 }),
    employeeRange: varchar("employee_range", { length: 64 }),
    fundingStage: varchar("funding_stage", { length: 64 }),
    totalFunding: text("total_funding"),
    website: text("website"),
    socialLinks: text("social_links"),
    tags: text("tags").default("").notNull(),
    status: varchar("status", { length: 32 }).default("published").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    companySlugIdx: index("company_slug_idx").on(table.slug),
    companyStatusIdx: index("company_status_idx").on(table.status),
    companyTypeIdx: index("company_type_idx").on(table.type),
  }),
);

export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: text("name").notNull(),
    coverImage: text("cover_image"),
    images: text("images").default("").notNull(),
    companyId: text("company_id").references(() => company.id, { onDelete: "set null" }),
    category: varchar("category", { length: 64 }).notNull(),
    subCategory: varchar("sub_category", { length: 80 }),
    industries: text("industries").default("").notNull(),
    capabilities: text("capabilities").default("").notNull(),
    specs: text("specs"),
    priceRange: varchar("price_range", { length: 64 }),
    description: text("description"),
    officialUrl: text("official_url"),
    lifecycleStatus: varchar("lifecycle_status", { length: 32 }).default("available").notNull(),
    publishStatus: varchar("publish_status", { length: 32 }).default("published").notNull(),
    tags: text("tags").default("").notNull(),
    popularity: integer("popularity").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    productSlugIdx: index("product_slug_idx").on(table.slug),
    productCompanyIdx: index("product_company_idx").on(table.companyId),
    productCategoryIdx: index("product_category_idx").on(table.category),
    productPublishStatusIdx: index("product_publish_status_idx").on(table.publishStatus),
  }),
);

export const newsArticle = pgTable(
  "news_article",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    coverImage: text("cover_image"),
    category: varchar("category", { length: 64 }).notNull(),
    tags: text("tags").default("").notNull(),
    relatedProductIds: text("related_product_ids").default("").notNull(),
    relatedCompanyIds: text("related_company_ids").default("").notNull(),
    publishedAt: timestamp("published_at"),
    publishStatus: varchar("publish_status", { length: 32 }).default("draft").notNull(),
    hotScore: integer("hot_score").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    newsArticleSlugIdx: index("news_article_slug_idx").on(table.slug),
    newsArticleStatusIdx: index("news_article_status_idx").on(table.publishStatus),
    newsArticlePublishedAtIdx: index("news_article_published_at_idx").on(table.publishedAt),
    newsArticleCategoryIdx: index("news_article_category_idx").on(table.category),
  }),
);

export const inquiry = pgTable(
  "inquiry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sourceType: varchar("source_type", { length: 32 }).default("general").notNull(),
    sourceId: text("source_id"),
    sourceName: text("source_name"),
    name: text("name").notNull(),
    companyName: text("company_name"),
    email: text("email").notNull(),
    phone: varchar("phone", { length: 64 }),
    industry: varchar("industry", { length: 80 }),
    scenario: text("scenario").notNull(),
    budgetRange: varchar("budget_range", { length: 64 }),
    message: text("message"),
    status: varchar("status", { length: 32 }).default("new").notNull(),
    adminNotes: text("admin_notes"),
    assignedTo: text("assigned_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    inquiryStatusIdx: index("inquiry_status_idx").on(table.status),
    inquiryCreatedAtIdx: index("inquiry_created_at_idx").on(table.createdAt),
    inquirySourceIdx: index("inquiry_source_idx").on(table.sourceType, table.sourceId),
  }),
);

export const vendorApplication = pgTable(
  "vendor_application",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: varchar("phone", { length: 64 }),
    website: text("website"),
    productTypes: text("product_types").default("").notNull(),
    cooperationIntent: text("cooperation_intent"),
    message: text("message"),
    status: varchar("status", { length: 32 }).default("new").notNull(),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    vendorApplicationStatusIdx: index("vendor_application_status_idx").on(table.status),
    vendorApplicationCreatedAtIdx: index("vendor_application_created_at_idx").on(table.createdAt),
  }),
);
