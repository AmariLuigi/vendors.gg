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

// Payment Methods table - stores user payment methods
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => accounts.id).notNull(),
  type: text('type').notNull(), // 'credit_card', 'paypal', 'crypto', 'bank_transfer'
  provider: text('provider'), // 'stripe', 'paypal', 'coinbase', etc.
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Encrypted payment details (for mock system, we'll store safe mock data)
  maskedDetails: jsonb('masked_details'), // {last4: '1234', brand: 'visa', expiryMonth: 12, expiryYear: 2025}
  billingAddress: jsonb('billing_address'),
  
  // Security and verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Orders table - main transaction records
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(), // Human-readable order number
  
  // Parties involved
  buyerId: uuid('buyer_id').references(() => accounts.id).notNull(),
  sellerId: uuid('seller_id').references(() => accounts.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  
  // Order details
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Fees and calculations
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }).default('0.00'),
  processingFee: decimal('processing_fee', { precision: 10, scale: 2 }).default('0.00'),
  sellerAmount: decimal('seller_amount', { precision: 10, scale: 2 }).notNull(), // Amount seller receives
  
  // Order status and lifecycle
  status: text('status').default('pending'), // 'pending', 'paid', 'processing', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded'
  paymentStatus: text('payment_status').default('pending'), // 'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
  deliveryStatus: text('delivery_status').default('pending'), // 'pending', 'in_progress', 'delivered', 'confirmed'
  
  // Important timestamps
  expiresAt: timestamp('expires_at'), // When the order expires if not paid
  paidAt: timestamp('paid_at'),
  deliveredAt: timestamp('delivered_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  
  // Delivery and fulfillment
  deliveryInstructions: text('delivery_instructions'),
  deliveryProof: jsonb('delivery_proof'), // Screenshots, tracking info, etc.
  buyerNotes: text('buyer_notes'),
  sellerNotes: text('seller_notes'),
  
  // Dispute and resolution
  disputeReason: text('dispute_reason'),
  disputeDetails: text('dispute_details'),
  resolutionNotes: text('resolution_notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Transactions table - detailed payment records
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  
  // Transaction details
  transactionId: text('transaction_id').notNull().unique(), // External payment provider transaction ID
  type: text('type').notNull(), // 'payment', 'refund', 'chargeback', 'fee'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Payment provider details
  provider: text('provider').notNull(), // 'mock', 'stripe', 'paypal', etc.
  providerTransactionId: text('provider_transaction_id'),
  providerResponse: jsonb('provider_response'), // Full response from payment provider
  
  // Transaction status
  status: text('status').notNull(), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  failureReason: text('failure_reason'),
  
  // Security and fraud detection
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  fraudFlags: jsonb('fraud_flags'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Timestamps
  processedAt: timestamp('processed_at'),
  settledAt: timestamp('settled_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Escrow table - holds funds during transaction
export const escrowHolds = pgTable('escrow_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  transactionId: uuid('transaction_id').references(() => paymentTransactions.id).notNull(),
  
  // Escrow details
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  status: text('status').default('held'), // 'held', 'released', 'refunded', 'disputed'
  
  // Release conditions
  autoReleaseAt: timestamp('auto_release_at'), // Automatic release date
  releaseCondition: text('release_condition'), // 'delivery_confirmed', 'time_elapsed', 'manual'
  
  // Release details
  releasedAt: timestamp('released_at'),
  releasedBy: uuid('released_by').references(() => accounts.id),
  releaseReason: text('release_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Notifications table - track payment-related notifications
export const paymentNotifications = pgTable('payment_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => accounts.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  transactionId: uuid('transaction_id').references(() => paymentTransactions.id),
  
  // Notification details
  type: text('type').notNull(), // 'payment_received', 'payment_failed', 'refund_processed', 'escrow_released', etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  
  // Delivery channels
  channels: jsonb('channels'), // ['email', 'sms', 'push', 'in_app']
  
  // Status tracking
  status: text('status').default('pending'), // 'pending', 'sent', 'delivered', 'failed'
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  
  // Metadata
  metadata: jsonb('metadata'), // Additional context data
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Refunds table - track refund requests and processing
export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  originalTransactionId: uuid('original_transaction_id').references(() => paymentTransactions.id).notNull(),
  refundTransactionId: uuid('refund_transaction_id').references(() => paymentTransactions.id),
  
  // Refund details
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  reason: text('reason').notNull(), // 'buyer_request', 'seller_cancel', 'dispute_resolution', 'chargeback'
  
  // Request details
  requestedBy: uuid('requested_by').references(() => accounts.id).notNull(),
  requestReason: text('request_reason'),
  requestNotes: text('request_notes'),
  
  // Processing
  status: text('status').default('pending'), // 'pending', 'approved', 'processing', 'completed', 'rejected'
  processedBy: uuid('processed_by').references(() => accounts.id),
  processingNotes: text('processing_notes'),
  
  // Timestamps
  requestedAt: timestamp('requested_at').defaultNow(),
  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Disputes table
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  escrowId: uuid('escrow_id').references(() => escrowHolds.id), // Optional escrow reference
  
  // Dispute details
  type: text('type').notNull(), // 'payment', 'delivery', 'quality', 'other'
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  requestedAmount: decimal('requested_amount', { precision: 10, scale: 2 }), // Amount being disputed
  
  // Parties involved
  createdBy: uuid('created_by').references(() => accounts.id).notNull(), // User who created the dispute
  initiatedBy: uuid('initiated_by').references(() => accounts.id).notNull(), // buyer or seller who started dispute
  respondentId: uuid('respondent_id').references(() => accounts.id).notNull(), // the other party
  
  // Status and resolution
  status: text('status').default('open'), // 'open', 'in_review', 'escalated', 'resolved', 'closed'
  priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'urgent'
  
  // Escalation details
  escalatedAt: timestamp('escalated_at'),
  escalationReason: text('escalation_reason'),
  
  // Resolution details
  resolution: text('resolution'), // 'refund', 'partial_refund', 'release_escrow', 'no_action'
  resolutionAmount: decimal('resolution_amount', { precision: 10, scale: 2 }),
  resolutionNotes: text('resolution_notes'),
  resolvedBy: uuid('resolved_by').references(() => accounts.id), // admin/mediator who resolved
  resolvedAt: timestamp('resolved_at'),
  
  // Evidence and attachments
  evidence: jsonb('evidence'), // array of file URLs, screenshots, etc.
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Dispute Messages table
export const disputeMessages = pgTable('dispute_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  disputeId: uuid('dispute_id').references(() => disputes.id).notNull(),
  
  // Message details
  senderId: uuid('sender_id').references(() => accounts.id).notNull(),
  message: text('message').notNull(),
  messageType: text('message_type').default('text'), // 'text', 'system', 'evidence'
  
  // Attachments
  attachments: jsonb('attachments'), // array of file URLs
  
  // Visibility
  isInternal: boolean('is_internal').default(false), // only visible to admins/mediators
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  paymentMethods: many(paymentMethods),
  buyerOrders: many(orders, {
    relationName: 'buyerOrders',
  }),
  sellerOrders: many(orders, {
    relationName: 'sellerOrders',
  }),
  paymentNotifications: many(paymentNotifications),
  refundRequests: many(refunds, {
    relationName: 'refundRequests',
  }),
  processedRefunds: many(refunds, {
    relationName: 'processedRefunds',
  }),
  escrowReleases: many(escrowHolds, {
    relationName: 'escrowReleases',
  }),
  initiatedDisputes: many(disputes, {
    relationName: 'initiatedDisputes',
  }),
  respondentDisputes: many(disputes, {
    relationName: 'respondentDisputes',
  }),
  resolvedDisputes: many(disputes, {
    relationName: 'resolvedDisputes',
  }),
  disputeMessages: many(disputeMessages),
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
  orders: many(orders),
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

// Payment system relations
export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(accounts, {
    fields: [paymentMethods.userId],
    references: [accounts.id],
  }),
  transactions: many(paymentTransactions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(accounts, {
    fields: [orders.buyerId],
    references: [accounts.id],
    relationName: 'buyerOrders',
  }),
  seller: one(accounts, {
    fields: [orders.sellerId],
    references: [accounts.id],
    relationName: 'sellerOrders',
  }),
  listing: one(listings, {
    fields: [orders.listingId],
    references: [listings.id],
  }),
  conversation: one(conversations, {
    fields: [orders.conversationId],
    references: [conversations.id],
  }),
  transactions: many(paymentTransactions),
  escrowHolds: many(escrowHolds),
  notifications: many(paymentNotifications),
  refunds: many(refunds),
  disputes: many(disputes),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one, many }) => ({
  order: one(orders, {
    fields: [paymentTransactions.orderId],
    references: [orders.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
  escrowHolds: many(escrowHolds),
  notifications: many(paymentNotifications),
  originalRefunds: many(refunds, {
    relationName: 'originalRefunds',
  }),
  refundTransactions: many(refunds, {
    relationName: 'refundTransactions',
  }),
}));

export const escrowHoldsRelations = relations(escrowHolds, ({ one }) => ({
  order: one(orders, {
    fields: [escrowHolds.orderId],
    references: [orders.id],
  }),
  transaction: one(paymentTransactions, {
    fields: [escrowHolds.transactionId],
    references: [paymentTransactions.id],
  }),
  releasedBy: one(accounts, {
    fields: [escrowHolds.releasedBy],
    references: [accounts.id],
    relationName: 'escrowReleases',
  }),
}));

export const paymentNotificationsRelations = relations(paymentNotifications, ({ one }) => ({
  user: one(accounts, {
    fields: [paymentNotifications.userId],
    references: [accounts.id],
  }),
  order: one(orders, {
    fields: [paymentNotifications.orderId],
    references: [orders.id],
  }),
  transaction: one(paymentTransactions, {
    fields: [paymentNotifications.transactionId],
    references: [paymentTransactions.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  originalTransaction: one(paymentTransactions, {
    fields: [refunds.originalTransactionId],
    references: [paymentTransactions.id],
    relationName: 'originalRefunds',
  }),
  refundTransaction: one(paymentTransactions, {
    fields: [refunds.refundTransactionId],
    references: [paymentTransactions.id],
    relationName: 'refundTransactions',
  }),
  requestedBy: one(accounts, {
    fields: [refunds.requestedBy],
    references: [accounts.id],
    relationName: 'refundRequests',
  }),
  processedBy: one(accounts, {
    fields: [refunds.processedBy],
    references: [accounts.id],
    relationName: 'processedRefunds',
  }),
}));

export const disputesRelations = relations(disputes, ({ one, many }) => ({
  order: one(orders, {
    fields: [disputes.orderId],
    references: [orders.id],
  }),
  escrow: one(escrowHolds, {
    fields: [disputes.escrowId],
    references: [escrowHolds.id],
  }),
  createdBy: one(accounts, {
    fields: [disputes.createdBy],
    references: [accounts.id],
    relationName: 'createdDisputes',
  }),
  initiatedBy: one(accounts, {
    fields: [disputes.initiatedBy],
    references: [accounts.id],
    relationName: 'initiatedDisputes',
  }),
  respondent: one(accounts, {
    fields: [disputes.respondentId],
    references: [accounts.id],
    relationName: 'respondentDisputes',
  }),
  resolvedBy: one(accounts, {
    fields: [disputes.resolvedBy],
    references: [accounts.id],
    relationName: 'resolvedDisputes',
  }),
  messages: many(disputeMessages),
}));

export const disputeMessagesRelations = relations(disputeMessages, ({ one }) => ({
  dispute: one(disputes, {
    fields: [disputeMessages.disputeId],
    references: [disputes.id],
  }),
  sender: one(accounts, {
    fields: [disputeMessages.senderId],
    references: [accounts.id],
  }),
}));

// Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => accounts.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  riskLevel: text('risk_level'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(accounts, {
    fields: [auditLogs.userId],
    references: [accounts.id],
  }),
}));