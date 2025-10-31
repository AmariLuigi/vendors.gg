// Payment System Types and Interfaces
// Comprehensive type definitions for secure payment processing

export type PaymentProvider = 'mock' | 'stripe' | 'paypal' | 'coinbase' | 'bank_transfer';
export type PaymentMethodType = 'credit_card' | 'debit_card' | 'paypal' | 'crypto' | 'bank_transfer';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';
export type DeliveryMethod = 'in_game' | 'email' | 'manual' | 'instant' | 'account' | 'physical' | 'digital';

// Order Status Types
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type DeliveryStatus = 
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'confirmed';

export type TransactionType = 'payment' | 'refund' | 'chargeback' | 'fee';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type EscrowStatus = 'held' | 'partial_release' | 'released' | 'refunded' | 'disputed' | 'expired';
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

// Payment Method Interface
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider?: PaymentProvider;
  isDefault: boolean;
  isActive: boolean;
  maskedDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
    stripePaymentMethodId?: string; // For Stripe payment methods
    email?: string; // For PayPal
    accountNumber?: string; // For bank transfers
    routingNumber?: string; // For bank transfers
    walletAddress?: string; // For crypto
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order Interface
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  listingId: string;
  listingTitle: string;
  conversationId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: Currency;
  platformFee: number;
  processingFee: number;
  sellerAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  deliveryMethod?: DeliveryMethod;
  notes?: string;
  expiresAt?: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  deliveryInstructions?: string;
  deliveryProof?: any[];
  buyerNotes?: string;
  sellerNotes?: string;
  disputeReason?: string;
  disputeDetails?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Transaction Interface
export interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentMethodId?: string;
  transactionId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerResponse?: any;
  status: TransactionStatus;
  failureReason?: string;
  riskScore?: number;
  fraudFlags?: any;
  ipAddress?: string;
  userAgent?: string;
  processedAt?: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Escrow Hold Interface
export interface EscrowHold {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: Currency;
  status: EscrowStatus;
  buyerId: string;
  sellerId: string;
  autoReleaseAt?: Date;
  releaseCondition?: string;
  releasedAt?: Date;
  releasedBy?: string;
  releaseReason?: string;
  releasedAmount?: number;
  expiresAt?: Date;
  disputedAt?: Date;
  disputeReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Refund Interface
export interface Refund {
  id: string;
  orderId: string;
  originalTransactionId: string;
  refundTransactionId?: string;
  amount: number;
  currency: Currency;
  reason: string;
  requestedBy: string;
  requestReason?: string;
  requestNotes?: string;
  status: RefundStatus;
  processedBy?: string;
  processingNotes?: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Request Interface
export interface PaymentRequest {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  currency: Currency;
  description?: string;
  metadata?: Record<string, any>;
}

// Payment Response Interface
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: TransactionStatus;
  message?: string;
  error?: string;
  redirectUrl?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

// Mock Payment Scenarios
export interface MockPaymentScenario {
  id: string;
  name: string;
  description: string;
  trigger: {
    amount?: number;
    cardNumber?: string;
    email?: string;
  };
  response: {
    success: boolean;
    status: TransactionStatus;
    delay?: number; // milliseconds
    error?: string;
    requiresAction?: boolean;
  };
}

// Payment Provider Interface
export interface PaymentProviderInterface {
  name: PaymentProvider;
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  refundPayment(transactionId: string, amount: number): Promise<PaymentResponse>;
  capturePayment(transactionId: string, amount: number): Promise<PaymentResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
  validatePaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<boolean>;
}

// Fee Calculation Interface
export interface FeeCalculation {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  total: number;
  sellerAmount: number;
  currency: Currency;
}

// Payment Configuration
export interface PaymentConfig {
  provider: PaymentProvider;
  environment: 'development' | 'staging' | 'production';
  fees: {
    platformFeePercentage: number;
    processingFeePercentage: number;
    minimumFee: number;
  };
  escrow: {
    autoReleaseHours: number;
    disputeWindowHours: number;
  };
  limits: {
    minTransactionAmount: number;
    maxTransactionAmount: number;
    dailyLimit: number;
  };
}

// Notification Types
export type PaymentNotificationType = 
  | 'payment_received'
  | 'payment_failed'
  | 'payment_pending'
  | 'refund_processed'
  | 'refund_failed'
  | 'escrow_released'
  | 'dispute_opened'
  | 'order_completed'
  | 'order_cancelled';

export interface PaymentNotification {
  id: string;
  userId: string;
  orderId?: string;
  transactionId?: string;
  type: PaymentNotificationType;
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Order Creation Request
export interface CreateOrderRequest {
  listingId: string;
  quantity: number;
  buyerNotes?: string;
  deliveryInstructions?: string;
}

// Payment Processing Request
export interface ProcessPaymentRequest {
  orderId: string;
  paymentMethodId: string;
  savePaymentMethod?: boolean;
}

// Refund Request Interface
export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, any>;
}

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: any;
  timestamp: Date;
  signature?: string;
}

// Security and Validation
export interface SecurityContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  riskScore?: number;
}

// Error Types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(message = 'Insufficient funds') {
    super(message, 'INSUFFICIENT_FUNDS', 402);
  }
}

export class InvalidPaymentMethodError extends PaymentError {
  constructor(message = 'Invalid payment method') {
    super(message, 'INVALID_PAYMENT_METHOD', 400);
  }
}

export class PaymentDeclinedError extends PaymentError {
  constructor(message = 'Payment declined') {
    super(message, 'PAYMENT_DECLINED', 402);
  }
}

export class FraudDetectedError extends PaymentError {
  constructor(message = 'Fraudulent activity detected') {
    super(message, 'FRAUD_DETECTED', 403);
  }
}