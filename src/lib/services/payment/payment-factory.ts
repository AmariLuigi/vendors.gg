// Payment Factory
// Environment-based strategy pattern for payment providers

import { 
  PaymentProviderInterface, 
  PaymentProvider, 
  PaymentConfig,
  PaymentError 
} from '@/lib/types/payment';
import { MockPaymentService } from './mock-payment-service';
import { StripePaymentService } from './stripe-payment-service';

class PayPalPaymentService implements PaymentProviderInterface {
  name: PaymentProvider = 'paypal';
  
  async processPayment(): Promise<any> {
    throw new PaymentError('PayPal integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async refundPayment(): Promise<any> {
    throw new PaymentError('PayPal integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async capturePayment(): Promise<any> {
    throw new PaymentError('PayPal integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async getTransactionStatus(): Promise<any> {
    throw new PaymentError('PayPal integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async validatePaymentMethod(): Promise<boolean> {
    throw new PaymentError('PayPal integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
}

class CoinbasePaymentService implements PaymentProviderInterface {
  name: PaymentProvider = 'coinbase';
  
  async processPayment(): Promise<any> {
    throw new PaymentError('Coinbase integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async refundPayment(): Promise<any> {
    throw new PaymentError('Coinbase integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async capturePayment(): Promise<any> {
    throw new PaymentError('Coinbase integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async getTransactionStatus(): Promise<any> {
    throw new PaymentError('Coinbase integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async validatePaymentMethod(): Promise<boolean> {
    throw new PaymentError('Coinbase integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
}

class BankTransferPaymentService implements PaymentProviderInterface {
  name: PaymentProvider = 'bank_transfer';
  
  async processPayment(): Promise<any> {
    throw new PaymentError('Bank transfer integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async refundPayment(): Promise<any> {
    throw new PaymentError('Bank transfer integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async capturePayment(): Promise<any> {
    throw new PaymentError('Bank transfer integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async getTransactionStatus(): Promise<any> {
    throw new PaymentError('Bank transfer integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
  
  async validatePaymentMethod(): Promise<boolean> {
    throw new PaymentError('Bank transfer integration not implemented', 'NOT_IMPLEMENTED', 501);
  }
}

// Payment Configuration Manager
export class PaymentConfigManager {
  private static instance: PaymentConfigManager;
  private config: PaymentConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): PaymentConfigManager {
    if (!PaymentConfigManager.instance) {
      PaymentConfigManager.instance = new PaymentConfigManager();
    }
    return PaymentConfigManager.instance;
  }

  private loadConfig(): PaymentConfig {
    const environment = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
    
    // Default configuration
    const baseConfig: PaymentConfig = {
      provider: 'mock',
      environment,
      fees: {
        platformFeePercentage: 5.0, // 5%
        processingFeePercentage: 2.9, // 2.9%
        minimumFee: 0.30 // $0.30
      },
      escrow: {
        autoReleaseHours: 72, // 3 days
        disputeWindowHours: 168 // 7 days
      },
      limits: {
        minTransactionAmount: 1.00,
        maxTransactionAmount: 10000.00,
        dailyLimit: 50000.00
      }
    };

    // Environment-specific overrides
    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          provider: 'mock',
          fees: {
            ...baseConfig.fees,
            platformFeePercentage: 1.0 // Lower fees for development
          }
        };

      case 'staging':
        return {
          ...baseConfig,
          provider: process.env.PAYMENT_PROVIDER as PaymentProvider || 'mock',
          fees: {
            ...baseConfig.fees,
            platformFeePercentage: 3.0 // Reduced fees for staging
          }
        };

      case 'production':
        return {
          ...baseConfig,
          provider: process.env.PAYMENT_PROVIDER as PaymentProvider || 'stripe',
          limits: {
            ...baseConfig.limits,
            maxTransactionAmount: 25000.00,
            dailyLimit: 100000.00
          }
        };

      default:
        return baseConfig;
    }
  }

  public getConfig(): PaymentConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PaymentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getProvider(): PaymentProvider {
    return this.config.provider;
  }

  public getFees() {
    return { ...this.config.fees };
  }

  public getEscrowConfig() {
    return { ...this.config.escrow };
  }

  public getLimits() {
    return { ...this.config.limits };
  }
}

// Payment Factory
export class PaymentFactory {
  private static instance: PaymentFactory;
  private providers: Map<PaymentProvider, PaymentProviderInterface>;
  private configManager: PaymentConfigManager;

  private constructor() {
    this.configManager = PaymentConfigManager.getInstance();
    this.providers = new Map();
    this.initializeProviders();
  }

  public static getInstance(): PaymentFactory {
    if (!PaymentFactory.instance) {
      PaymentFactory.instance = new PaymentFactory();
    }
    return PaymentFactory.instance;
  }

  private initializeProviders(): void {
    // Initialize all available providers
    this.providers.set('mock', new MockPaymentService());

    // Conditionally initialize Stripe to avoid crashing when not configured
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        this.providers.set('stripe', new StripePaymentService());
      } else {
        console.warn('Stripe not configured (STRIPE_SECRET_KEY missing). Skipping Stripe provider initialization.');
      }
    } catch (error) {
      console.warn('Failed to initialize Stripe provider. Falling back to mock.', error);
    }
    this.providers.set('paypal', new PayPalPaymentService());
    this.providers.set('coinbase', new CoinbasePaymentService());
    this.providers.set('bank_transfer', new BankTransferPaymentService());
  }

  public getProvider(providerName?: PaymentProvider): PaymentProviderInterface {
    const provider = providerName || this.configManager.getProvider();

    // If requested provider is unavailable (e.g., Stripe missing), gracefully fall back to mock
    const service = this.providers.get(provider);
    if (!service) {
      console.warn(`Payment provider '${provider}' unavailable. Using 'mock' provider instead.`);
      const fallback = this.providers.get('mock');
      if (fallback) return fallback;
      throw new PaymentError(
        `Payment provider '${provider}' not available and no fallback found`,
        'PROVIDER_NOT_FOUND',
        404
      );
    }

    return service;
  }

  public getDefaultProvider(): PaymentProviderInterface {
    return this.getProvider();
  }

  public getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }

  public isProviderAvailable(provider: PaymentProvider): boolean {
    return this.providers.has(provider);
  }

  public switchProvider(provider: PaymentProvider): void {
    if (!this.isProviderAvailable(provider)) {
      throw new PaymentError(
        `Payment provider '${provider}' is not available`,
        'PROVIDER_NOT_AVAILABLE',
        400
      );
    }

    this.configManager.updateConfig({ provider });
    console.log(`🔄 Switched to payment provider: ${provider}`);
  }

  // Provider health checks
  public async checkProviderHealth(provider?: PaymentProvider): Promise<boolean> {
    try {
      const service = this.getProvider(provider);
      
      // For mock service, always return true
      if (service.name === 'mock') {
        return true;
      }

      // For real providers, implement actual health checks
      // This is a placeholder for future implementation
      return false;
    } catch (error) {
      console.error(`❌ Provider health check failed for ${provider}:`, error);
      return false;
    }
  }

  public async checkAllProvidersHealth(): Promise<Record<PaymentProvider, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this.getAllProviders()) {
      results[provider] = await this.checkProviderHealth(provider);
    }

    return results as Record<PaymentProvider, boolean>;
  }
}

// Fee Calculator
export class FeeCalculator {
  private configManager: PaymentConfigManager;

  constructor() {
    this.configManager = PaymentConfigManager.getInstance();
  }

  public calculateFees(amount: number, currency = 'USD') {
    const fees = this.configManager.getFees();
    
    // Calculate platform fee
    const platformFee = Math.max(
      (amount * fees.platformFeePercentage) / 100,
      fees.minimumFee
    );

    // Calculate processing fee
    const processingFee = Math.max(
      (amount * fees.processingFeePercentage) / 100,
      fees.minimumFee
    );

    const totalFees = platformFee + processingFee;
    const sellerAmount = amount - totalFees;
    const total = amount;

    return {
      subtotal: amount,
      platformFee: Math.round(platformFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      total: Math.round(total * 100) / 100,
      sellerAmount: Math.round(sellerAmount * 100) / 100,
      currency
    };
  }

  public validateAmount(amount: number): boolean {
    const limits = this.configManager.getLimits();
    return amount >= limits.minTransactionAmount && amount <= limits.maxTransactionAmount;
  }

  public getAmountLimits() {
    return this.configManager.getLimits();
  }
}

// Export singleton instances
export const paymentFactory = PaymentFactory.getInstance();
export const paymentConfigManager = PaymentConfigManager.getInstance();
export const feeCalculator = new FeeCalculator();

// Utility functions
export function getPaymentProvider(provider?: PaymentProvider): PaymentProviderInterface {
  return paymentFactory.getProvider(provider);
}

export function calculatePaymentFees(amount: number, currency = 'USD') {
  return feeCalculator.calculateFees(amount, currency);
}

export function validatePaymentAmount(amount: number): boolean {
  return feeCalculator.validateAmount(amount);
}