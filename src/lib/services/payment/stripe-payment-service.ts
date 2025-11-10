// Stripe Payment Service Implementation
// Real payment processing using Stripe API

import Stripe from 'stripe';
import { 
  PaymentProviderInterface, 
  PaymentProvider, 
  PaymentError,
  ProcessPaymentRequest,
  PaymentMethod
} from '@/lib/types/payment';

export class StripePaymentService implements PaymentProviderInterface {
  name: PaymentProvider = 'stripe';
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }

  /**
   * Process payment using Stripe
   */
  async processPayment(request: ProcessPaymentRequest): Promise<any> {
    try {
      const { orderId, paymentMethodId } = request;

      // Note: In a real implementation, you would fetch the order details
      // from the database to get amount, currency, etc.
      // For now, we'll use placeholder values
      const amount = 1000; // This should come from the order
      const currency = 'USD'; // This should come from the order
      const metadata = { orderId }; // Additional metadata

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/buyer/orders/${orderId}`,
        metadata: {
          ...metadata,
          orderId,
        },
        // For marketplace - hold funds in platform account initially
        capture_method: 'manual', // Manual capture for escrow
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
        requiresAction: paymentIntent.status === 'requires_action',
        clientSecret: paymentIntent.client_secret,
      };

    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new PaymentError(
        error instanceof Error ? error.message : 'Payment processing failed',
        'PAYMENT_FAILED',
        400
      );
    }
  }

  /**
   * Capture payment (release from escrow)
   */
  async capturePayment(transactionId: string, amount: number): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(transactionId, {
        amount_to_capture: Math.round(amount * 100),
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };

    } catch (error) {
      console.error('Stripe capture error:', error);
      throw new PaymentError(
        error instanceof Error ? error.message : 'Payment capture failed',
        'CAPTURE_FAILED',
        400
      );
    }
  }

  /**
   * Process refund
   */
  async refundPayment(transactionId: string, amount: number): Promise<any> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.round(amount * 100),
        reason: 'requested_by_customer',
        metadata: {
          originalTransactionId: transactionId,
        },
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        providerResponse: refund,
      };

    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new PaymentError(
        error instanceof Error ? error.message : 'Refund processing failed',
        'REFUND_FAILED',
        400
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };

    } catch (error) {
      console.error('Stripe status check error:', error);
      throw new PaymentError(
        error instanceof Error ? error.message : 'Status check failed',
        'STATUS_CHECK_FAILED',
        400
      );
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<boolean> {
    try {
      // For Stripe, we can validate by attempting to retrieve the payment method
      if (paymentMethod.provider === 'stripe' && paymentMethod.maskedDetails?.stripePaymentMethodId) {
        const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(
          paymentMethod.maskedDetails.stripePaymentMethodId
        );
        return !!stripePaymentMethod;
      }

      // Basic validation for card details
      if (paymentMethod.type === 'credit_card' && paymentMethod.maskedDetails) {
        const { last4, expiryMonth, expiryYear } = paymentMethod.maskedDetails;
        
        if (!last4 || last4.length !== 4) return false;
        if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) return false;
        if (!expiryYear || expiryYear < new Date().getFullYear()) return false;
        
        return true;
      }

      return false;

    } catch (error) {
      console.error('Stripe validation error:', error);
      return false;
    }
  }

  /**
   * Create payment method using provider interface-compatible request
   */
  async createPaymentMethod(request: {
    type: 'card' | string;
    cardDetails?: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
      name?: string;
    };
  }): Promise<{
    paymentMethodId: string;
    type: 'credit_card';
    maskedDetails: {
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
      holderName?: string;
      stripePaymentMethodId?: string;
    };
    providerResponse?: any;
  }> {
    try {
      if (request.type !== 'card') {
        throw new PaymentError('Unsupported payment method type for Stripe', 'UNSUPPORTED_TYPE', 400);
      }
      const cardDetails = request.cardDetails;
      if (!cardDetails) {
        throw new PaymentError('Missing card details', 'MISSING_CARD_DETAILS', 400);
      }
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.exp_month,
          exp_year: cardDetails.exp_year,
          cvc: cardDetails.cvc,
        },
        billing_details: {
          name: cardDetails.name,
        },
      });

      return {
        paymentMethodId: paymentMethod.id,
        type: 'credit_card',
        maskedDetails: {
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year,
          stripePaymentMethodId: paymentMethod.id,
        },
        providerResponse: paymentMethod,
      };

    } catch (error) {
      console.error('Stripe payment method creation error:', error);
      throw new PaymentError(
        error instanceof Error ? error.message : 'Payment method creation failed',
        'PAYMENT_METHOD_CREATION_FAILED',
        400
      );
    }
  }

  /**
   * Set up webhook endpoint verification
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      return true;
    } catch (error) {
      console.error('Stripe webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Map Stripe status to internal status
   */
  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'authorized',
      'succeeded': 'completed',
      'canceled': 'cancelled',
    };

    return statusMap[stripeStatus] || 'pending';
  }
}