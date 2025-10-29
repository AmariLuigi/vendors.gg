import { pgTable, text, integer, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
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

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
  categories: many(categories),
  subcategories: many(subcategories),
  servers: many(servers),
  leagues: many(leagues),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  game: one(games, {
    fields: [categories.gameId],
    references: [games.id],
  }),
  subcategories: many(subcategories),
}));

export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  game: one(games, {
    fields: [subcategories.gameId],
    references: [games.id],
  }),
}));

export const serversRelations = relations(servers, ({ one }) => ({
  game: one(games, {
    fields: [servers.gameId],
    references: [games.id],
  }),
}));

export const leaguesRelations = relations(leagues, ({ one }) => ({
  game: one(games, {
    fields: [leagues.gameId],
    references: [games.id],
  }),
}));