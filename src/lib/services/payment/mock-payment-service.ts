// Mock Payment Service
// Realistic payment simulation for development and testing

import { 
  PaymentProviderInterface, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentMethod,
  TransactionStatus,
  MockPaymentScenario,
  PaymentProvider,
  PaymentError,
  InsufficientFundsError,
  InvalidPaymentMethodError,
  PaymentDeclinedError,
  FraudDetectedError
} from '@/lib/types/payment';

export class MockPaymentService implements PaymentProviderInterface {
  name: PaymentProvider = 'mock';
  
  private scenarios: MockPaymentScenario[] = [
    // Success scenarios
    {
      id: 'success_default',
      name: 'Default Success',
      description: 'Standard successful payment',
      trigger: {},
      response: {
        success: true,
        status: 'completed',
        delay: 1000
      }
    },
    {
      id: 'success_slow',
      name: 'Slow Success',
      description: 'Successful payment with processing delay',
      trigger: { amount: 999.99 },
      response: {
        success: true,
        status: 'completed',
        delay: 5000
      }
    },
    
    // Failure scenarios
    {
      id: 'insufficient_funds',
      name: 'Insufficient Funds',
      description: 'Payment fails due to insufficient funds',
      trigger: { cardNumber: '4000000000000002' },
      response: {
        success: false,
        status: 'failed',
        delay: 1500,
        error: 'INSUFFICIENT_FUNDS'
      }
    },
    {
      id: 'card_declined',
      name: 'Card Declined',
      description: 'Payment declined by issuer',
      trigger: { cardNumber: '4000000000000069' },
      response: {
        success: false,
        status: 'failed',
        delay: 2000,
        error: 'CARD_DECLINED'
      }
    },
    {
      id: 'expired_card',
      name: 'Expired Card',
      description: 'Payment fails due to expired card',
      trigger: { cardNumber: '4000000000000069' },
      response: {
        success: false,
        status: 'failed',
        delay: 1000,
        error: 'EXPIRED_CARD'
      }
    },
    {
      id: 'fraud_detected',
      name: 'Fraud Detection',
      description: 'Payment blocked due to fraud detection',
      trigger: { amount: 10000 },
      response: {
        success: false,
        status: 'failed',
        delay: 3000,
        error: 'FRAUD_DETECTED'
      }
    },
    
    // 3D Secure scenarios
    {
      id: 'requires_3ds',
      name: '3D Secure Required',
      description: 'Payment requires 3D Secure authentication',
      trigger: { cardNumber: '4000000000003220' },
      response: {
        success: false,
        status: 'pending',
        delay: 1500,
        requiresAction: true
      }
    },
    
    // Processing scenarios
    {
      id: 'processing_delay',
      name: 'Processing Delay',
      description: 'Payment is processing and will complete later',
      trigger: { amount: 500.00 },
      response: {
        success: true,
        status: 'processing',
        delay: 2000
      }
    },
    
    // Network/System errors
    {
      id: 'network_error',
      name: 'Network Error',
      description: 'Temporary network connectivity issue',
      trigger: { cardNumber: '4000000000000119' },
      response: {
        success: false,
        status: 'failed',
        delay: 5000,
        error: 'NETWORK_ERROR'
      }
    },
    {
      id: 'system_error',
      name: 'System Error',
      description: 'Internal system error',
      trigger: { cardNumber: '4000000000000127' },
      response: {
        success: false,
        status: 'failed',
        delay: 1000,
        error: 'SYSTEM_ERROR'
      }
    }
  ];

  private transactions = new Map<string, any>();
  private paymentMethods = new Map<string, any>();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize some mock payment methods for testing
    this.paymentMethods.set('pm_test_visa', {
      id: 'pm_test_visa',
      type: 'credit_card',
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isValid: true
    });

    this.paymentMethods.set('pm_test_mastercard', {
      id: 'pm_test_mastercard',
      type: 'credit_card',
      brand: 'mastercard',
      last4: '5555',
      expiryMonth: 10,
      expiryYear: 2024,
      isValid: true
    });

    this.paymentMethods.set('pm_test_declined', {
      id: 'pm_test_declined',
      type: 'credit_card',
      brand: 'visa',
      last4: '0002',
      expiryMonth: 8,
      expiryYear: 2023,
      isValid: false
    });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('🔄 Processing mock payment:', request);

    // Validate request
    if (!request.orderId || !request.amount || request.amount <= 0) {
      throw new PaymentError('Invalid payment request', 'INVALID_REQUEST', 400);
    }

    // Get payment method details
    const paymentMethod = this.paymentMethods.get(request.paymentMethodId);
    if (!paymentMethod) {
      throw new InvalidPaymentMethodError('Payment method not found');
    }

    // Find matching scenario
    const scenario = this.findMatchingScenario(request, paymentMethod);
    
    // Generate transaction ID
    const transactionId = this.generateTransactionId();
    
    // Simulate processing delay
    if (scenario.response.delay) {
      await this.delay(scenario.response.delay);
    }

    // Store transaction
    this.transactions.set(transactionId, {
      id: transactionId,
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency,
      status: scenario.response.status,
      scenario: scenario.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Handle different response types
    if (!scenario.response.success) {
      const error = this.createErrorFromScenario(scenario);
      console.log('❌ Mock payment failed:', error.message);
      throw error;
    }

    const response: PaymentResponse = {
      success: true,
      transactionId,
      status: scenario.response.status,
      message: `Payment processed successfully using scenario: ${scenario.name}`,
      requiresAction: scenario.response.requiresAction
    };

    if (scenario.response.requiresAction) {
      response.clientSecret = `pi_${transactionId}_secret_${Date.now()}`;
      response.redirectUrl = `/payment/authenticate/${transactionId}`;
    }

    console.log('✅ Mock payment successful:', response);
    return response;
  }

  async refundPayment(transactionId: string, amount: number): Promise<PaymentResponse> {
    console.log('🔄 Processing mock refund:', { transactionId, amount });

    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new PaymentError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    if (amount > transaction.amount) {
      throw new PaymentError('Refund amount exceeds original transaction', 'INVALID_AMOUNT', 400);
    }

    // Simulate processing delay
    await this.delay(1500);

    const refundId = this.generateTransactionId('ref');
    
    // Store refund transaction
    this.transactions.set(refundId, {
      id: refundId,
      originalTransactionId: transactionId,
      amount,
      currency: transaction.currency,
      status: 'completed',
      type: 'refund',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Mock refund successful');
    return {
      success: true,
      transactionId: refundId,
      status: 'completed',
      message: 'Refund processed successfully'
    };
  }

  async capturePayment(transactionId: string, amount: number): Promise<PaymentResponse> {
    console.log('🔄 Processing mock capture:', { transactionId, amount });

    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new PaymentError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    if (amount > transaction.amount) {
      throw new PaymentError('Capture amount exceeds authorized amount', 'INVALID_AMOUNT', 400);
    }

    // Simulate processing delay
    await this.delay(1000);

    // Update transaction status to captured
    transaction.status = 'completed';
    transaction.updatedAt = new Date();
    this.transactions.set(transactionId, transaction);

    console.log('✅ Mock capture successful');
    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'Payment captured successfully'
    };
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new PaymentError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    // Simulate status updates for processing transactions
    if (transaction.status === 'processing') {
      const elapsed = Date.now() - transaction.createdAt.getTime();
      if (elapsed > 10000) { // After 10 seconds, mark as completed
        transaction.status = 'completed';
        transaction.updatedAt = new Date();
        this.transactions.set(transactionId, transaction);
      }
    }

    return transaction.status;
  }

  async validatePaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<boolean> {
    // Simulate validation delay
    await this.delay(500);

    // Basic validation rules
    if (!paymentMethod.type) return false;
    
    if (paymentMethod.type === 'credit_card') {
      const maskedDetails = paymentMethod.maskedDetails;
      if (!maskedDetails?.last4 || !maskedDetails?.expiryMonth || !maskedDetails?.expiryYear) {
        return false;
      }

      // Check if card is expired
      const now = new Date();
      const expiry = new Date(maskedDetails.expiryYear, maskedDetails.expiryMonth - 1);
      if (expiry < now) {
        return false;
      }

      // Mock validation based on last4
      const invalidLast4s = ['0002', '0069', '0119', '0127'];
      if (invalidLast4s.includes(maskedDetails.last4)) {
        return false;
      }
    }

    return true;
  }

  // Utility methods
  private findMatchingScenario(request: PaymentRequest, paymentMethod: any): MockPaymentScenario {
    // Check for specific triggers
    for (const scenario of this.scenarios) {
      const trigger = scenario.trigger;
      
      if (trigger.amount && Math.abs(request.amount - trigger.amount) < 0.01) {
        return scenario;
      }
      
      if (trigger.cardNumber && paymentMethod.last4 === trigger.cardNumber.slice(-4)) {
        return scenario;
      }
      
      if (trigger.email && request.metadata?.email === trigger.email) {
        return scenario;
      }
    }

    // Return default success scenario
    return this.scenarios[0];
  }

  private createErrorFromScenario(scenario: MockPaymentScenario): PaymentError {
    const errorCode = scenario.response.error || 'PAYMENT_FAILED';
    
    switch (errorCode) {
      case 'INSUFFICIENT_FUNDS':
        return new InsufficientFundsError();
      case 'CARD_DECLINED':
        return new PaymentDeclinedError('Your card was declined');
      case 'EXPIRED_CARD':
        return new InvalidPaymentMethodError('Your card has expired');
      case 'FRAUD_DETECTED':
        return new FraudDetectedError();
      case 'NETWORK_ERROR':
        return new PaymentError('Network connectivity issue', 'NETWORK_ERROR', 503);
      case 'SYSTEM_ERROR':
        return new PaymentError('Internal system error', 'SYSTEM_ERROR', 500);
      default:
        return new PaymentError(scenario.response.error || 'Payment failed', errorCode);
    }
  }

  private generateTransactionId(prefix = 'txn'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_mock_${timestamp}_${random}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test utilities
  public getScenarios(): MockPaymentScenario[] {
    return [...this.scenarios];
  }

  public addScenario(scenario: MockPaymentScenario): void {
    this.scenarios.push(scenario);
  }

  public clearTransactions(): void {
    this.transactions.clear();
  }

  public getTransaction(transactionId: string): any {
    return this.transactions.get(transactionId);
  }

  public getAllTransactions(): any[] {
    return Array.from(this.transactions.values());
  }

  // Risk assessment simulation
  public calculateRiskScore(request: PaymentRequest, context: any): number {
    let riskScore = 0;

    // Amount-based risk
    if (request.amount > 1000) riskScore += 20;
    if (request.amount > 5000) riskScore += 30;
    if (request.amount > 10000) riskScore += 50;

    // Frequency-based risk (mock)
    const recentTransactions = Array.from(this.transactions.values())
      .filter(t => t.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    if (recentTransactions.length > 5) riskScore += 25;
    if (recentTransactions.length > 10) riskScore += 50;

    // Geographic risk (mock)
    if (context?.ipAddress?.startsWith('192.168.')) riskScore -= 10; // Local network
    
    // Time-based risk
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) riskScore += 15; // Late night transactions

    return Math.max(0, Math.min(100, riskScore));
  }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();