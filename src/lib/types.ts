// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  accountType: 'buyer' | 'seller' | 'both';
  rating: number;
  totalTransactions: number;
  verified: boolean;
  badges: string[];
  createdAt: Date;
}

// Game types
export interface Game {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  servers: Server[];
  leagues?: League[];
}

export interface Server {
  id: string;
  name: string;
  region: string;
}

export interface League {
  id: string;
  name: string;
  tier: string;
}

// Path of Exile League from official API (legacy)
export interface PoELeague {
  id: string;
  name: string;
  realm: string;
  url: string;
  startAt: string | null;
  endAt: string | null;
  description: string;
  category: {
    id: string;
  };
  registerAt?: string;
  delveEvent?: boolean;
  rules: PoELeagueRule[];
}

export interface PoELeagueRule {
  id: string;
  name: string;
  description: string;
}

// PoE2 League from poe2scout.com API
export interface PoE2League {
  value: string;
  divinePrice: number;
  chaosDivinePrice: number;
}

// Item types
export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP';
  images: string[];
  videoProof?: string;
  game: Game;
  server: Server;
  league?: League;
  seller: User;
  category: string;
  deliveryMethod: 'instant' | 'manual' | 'account';
  deliveryTime: string;
  inStock: boolean;
  quantity: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  item: Item;
  buyer: User;
  seller: User;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
  escrowStatus: 'held' | 'released' | 'refunded';
  paymentMethod: string;
  deliveryDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Filter types
export interface ItemFilters {
  game?: string;
  server?: string;
  league?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sellerRating?: number;
  deliveryMethod?: string;
  inStock?: boolean;
  sortBy?: 'price' | 'rating' | 'newest' | 'oldest';
  sortOrder?: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  accountType: 'buyer' | 'seller' | 'both';
}

export interface CreateListingForm {
  title: string;
  description: string;
  price: number;
  currency: string;
  gameId: string;
  serverId: string;
  leagueId?: string;
  category: string;
  deliveryMethod: string;
  deliveryTime: string;
  quantity: number;
  images: File[];
  videoProof?: File;
  tags: string[];
}