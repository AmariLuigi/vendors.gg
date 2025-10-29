import { pgTable, text, integer, boolean, timestamp, uuid, jsonb, decimal, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Games table
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  hasServers: boolean('has_servers').default(false),
  hasLeagues: boolean('has_leagues').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Accounts table
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  accountType: text('account_type').notNull(), // 'buyer', 'seller', 'both'
  isVerified: boolean('is_verified').default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: integer('total_reviews').default(0),
  avatar: text('avatar'),
  bio: text('bio'),
  
  // Contact and personal information
  phone: text('phone'),
  country: text('country'),
  timezone: text('timezone'),
  language: text('language').default('en'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender'),
  
  // Seller-specific fields
  businessName: text('business_name'),
  businessType: text('business_type'), // 'individual', 'business', 'company'
  taxId: text('tax_id'),
  businessAddress: jsonb('business_address'),
  businessPhone: text('business_phone'),
  businessEmail: text('business_email'),
  website: text('website'),
  socialLinks: jsonb('social_links'), // {twitter, discord, twitch, etc}
  
  // Trading preferences and settings
  preferredGames: jsonb('preferred_games'), // array of game IDs
  tradingRegions: jsonb('trading_regions'), // array of supported regions
  paymentMethods: jsonb('payment_methods'), // array of accepted payment methods
  deliveryMethods: jsonb('delivery_methods'), // array of delivery methods offered
  responseTime: text('response_time'), // 'within_1_hour', 'within_24_hours', etc
  tradingHours: jsonb('trading_hours'), // {start: '09:00', end: '18:00', timezone: 'UTC'}
  
  // Verification and trust
  verificationLevel: text('verification_level').default('basic'), // 'basic', 'verified', 'premium'
  verificationDocuments: jsonb('verification_documents'), // array of document URLs
  kycStatus: text('kyc_status').default('pending'), // 'pending', 'approved', 'rejected'
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  
  // Statistics and performance
  totalSales: integer('total_sales').default(0),
  totalPurchases: integer('total_purchases').default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0.00'),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0.00'), // percentage
  averageDeliveryTime: integer('average_delivery_time'), // in hours
  disputeCount: integer('dispute_count').default(0),
  positiveFeedbackCount: integer('positive_feedback_count').default(0),
  negativeFeedbackCount: integer('negative_feedback_count').default(0),
  
  // Account status and settings
  accountStatus: text('account_status').default('active'), // 'active', 'suspended', 'banned', 'inactive'
  lastActive: timestamp('last_active'),
  notificationPreferences: jsonb('notification_preferences'), // email, sms, push notifications settings
  privacySettings: jsonb('privacy_settings'), // profile visibility, contact preferences
  marketingConsent: boolean('marketing_consent').default(false),
  
  // Profile completion and onboarding
  profileCompletion: integer('profile_completion').default(0), // percentage 0-100
  onboardingCompleted: boolean('onboarding_completed').default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  privacyPolicyAcceptedAt: timestamp('privacy_policy_accepted_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  gameId: uuid('game_id').references(() => games.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subcategories table
export const subcategories = pgTable('subcategories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  gameId: uuid('game_id').references(() => games.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Servers table
export const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  region: text('region'),
  gameId: uuid('game_id').references(() => games.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Leagues table (for games like PoE)
export const leagues = pgTable('leagues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  gameId: uuid('game_id').references(() => games.id),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'), // For storing additional data like prices, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Listings table
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').references(() => accounts.id).notNull(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  serverId: uuid('server_id').references(() => servers.id),
  leagueId: uuid('league_id').references(() => leagues.id),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  subcategoryId: uuid('subcategory_id').references(() => subcategories.id),
  
  // Basic listing info
  title: text('title').notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  rarity: text('rarity'),
  condition: text('condition'),
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  negotiable: boolean('negotiable').default(false),
  minimumPrice: decimal('minimum_price', { precision: 10, scale: 2 }),
  bulkDiscount: decimal('bulk_discount', { precision: 5, scale: 2 }),
  
  // Auction settings
  auctionMode: boolean('auction_mode').default(false),
  auctionDuration: integer('auction_duration'), // in hours
  
  // Media
  images: jsonb('images'), // array of image URLs
  videoProof: text('video_proof'),
  
  // Advanced options
  deliveryTime: text('delivery_time'),
  deliveryMethod: text('delivery_method'),
  regions: jsonb('regions'), // array of supported regions
  minBuyerRating: decimal('min_buyer_rating', { precision: 3, scale: 2 }),
  
  // Publishing options
  publishLater: boolean('publish_later').default(false),
  autoRelist: boolean('auto_relist').default(false),
  scheduledDate: timestamp('scheduled_date'),
  
  // Status and metadata
  status: text('status').default('active'), // 'active', 'sold', 'paused', 'expired'
  views: integer('views').default(0),
  favorites: integer('favorites').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id').references(() => accounts.id).notNull(),
  sellerId: uuid('seller_id').references(() => accounts.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id),
  orderId: uuid('order_id'), // Reference to order when implemented
  status: text('status').default('active'), // 'active', 'closed', 'archived'
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  senderId: uuid('sender_id').references(() => accounts.id).notNull(),
  content: text('content').notNull(),
  messageType: text('message_type').default('text'), // 'text', 'image', 'file', 'system'
  attachments: jsonb('attachments'), // array of file URLs/metadata
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => accounts.id).notNull(),
  sessionToken: text('session_token').notNull().unique(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Verification tokens table
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => accounts.id),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'email_verification', 'password_reset'
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Favorites table
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => accounts.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
  categories: many(categories),
  subcategories: many(subcategories),
  servers: many(servers),
  leagues: many(leagues),
  listings: many(listings),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  listings: many(listings),
  sentMessages: many(messages),
  buyerConversations: many(conversations, {
    relationName: 'buyerConversations',
  }),
  sellerConversations: many(conversations, {
    relationName: 'sellerConversations',
  }),
  sessions: many(sessions),
  verificationTokens: many(verificationTokens),
  favorites: many(favorites),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  game: one(games, {
    fields: [categories.gameId],
    references: [games.id],
  }),
  subcategories: many(subcategories),
  listings: many(listings),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  game: one(games, {
    fields: [subcategories.gameId],
    references: [games.id],
  }),
  listings: many(listings),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  game: one(games, {
    fields: [servers.gameId],
    references: [games.id],
  }),
  listings: many(listings),
}));

export const leaguesRelations = relations(leagues, ({ one, many }) => ({
  game: one(games, {
    fields: [leagues.gameId],
    references: [games.id],
  }),
  listings: many(listings),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(accounts, {
    fields: [listings.sellerId],
    references: [accounts.id],
  }),
  game: one(games, {
    fields: [listings.gameId],
    references: [games.id],
  }),
  server: one(servers, {
    fields: [listings.serverId],
    references: [servers.id],
  }),
  league: one(leagues, {
    fields: [listings.leagueId],
    references: [leagues.id],
  }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [listings.subcategoryId],
    references: [subcategories.id],
  }),
  conversations: many(conversations),
  favorites: many(favorites),
}));

// Conversations relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  buyer: one(accounts, {
    fields: [conversations.buyerId],
    references: [accounts.id],
    relationName: 'buyerConversations',
  }),
  seller: one(accounts, {
    fields: [conversations.sellerId],
    references: [accounts.id],
    relationName: 'sellerConversations',
  }),
  listing: one(listings, {
    fields: [conversations.listingId],
    references: [listings.id],
  }),
  messages: many(messages),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(accounts, {
    fields: [messages.senderId],
    references: [accounts.id],
  }),
}));

// Sessions relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(accounts, {
    fields: [sessions.userId],
    references: [accounts.id],
  }),
}));

// Verification tokens relations
export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(accounts, {
    fields: [verificationTokens.userId],
    references: [accounts.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(accounts, {
    fields: [favorites.userId],
    references: [accounts.id],
  }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
}));