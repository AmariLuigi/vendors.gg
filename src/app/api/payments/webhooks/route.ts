// Payment Webhooks API Route
// Handles webhook events from payment providers

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentTransactions, orders, escrowHolds, refunds } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { WebhookEvent, PaymentStatus, TransactionStatus, PaymentProvider } from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { EscrowService } from '@/lib/services/escrow/escrow-service';
import crypto from 'crypto';

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: string
): boolean {
  try {
    switch (provider) {
      case 'stripe':
        // Stripe webhook signature verification
        const stripeSignature = crypto
          .createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
        return crypto.timingSafeEqual(
          Buffer.from(signature.replace('sha256=', '')),
          Buffer.from(stripeSignature)
        );

      case 'paypal':
        // PayPal webhook signature verification
        const paypalSignature = crypto
          .createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('base64');
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(paypalSignature)
        );

      case 'mock':
        // Mock provider - always verify for testing
        return true;

      default:
        console.warn(`⚠️ Unknown provider for webhook verification: ${provider}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error);
    return false;
  }
}

// Process payment webhook events
async function processPaymentWebhook(event: WebhookEvent) {
  try {
    const { type, data, provider } = event;

    switch (type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(data, provider);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data, provider);
        break;

      case 'payment.processing':
        await handlePaymentProcessing(data, provider);
        break;

      case 'refund.succeeded':
        await handleRefundSucceeded(data, provider);
        break;

      case 'refund.failed':
        await handleRefundFailed(data, provider);
        break;

      case 'chargeback.created':
        await handleChargebackCreated(data, provider);
        break;

      case 'dispute.created':
        await handleDisputeCreated(data, provider);
        break;

      default:
        console.warn(`⚠️ Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
}

// Handle successful payment
async function handlePaymentSucceeded(data: any, provider: string) {
  const { transactionId, amount, currency, metadata } = data;

  // Find the transaction
  const transaction = await db.query.paymentTransactions.findFirst({
    where: and(
      eq(paymentTransactions.providerTransactionId, transactionId),
      eq(paymentTransactions.provider, provider)
    ),
    with: {
      order: true
    }
  });

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for webhook: ${transactionId}`);
    return;
  }

  // Update transaction status
  await db
    .update(paymentTransactions)
    .set({
      status: 'completed',
      processedAt: new Date(),
      updatedAt: new Date(),
      providerResponse: data
    })
    .where(eq(paymentTransactions.id, transaction.id));

  // Update order status
  if (transaction.order) {
    const order = transaction.order as { id: string };
    await db
      .update(orders)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));

    // Create escrow hold
    await db.insert(escrowHolds).values({
      orderId: order.id,
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: 'held',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`✅ Payment succeeded webhook processed: ${transactionId}`);
}

// Handle failed payment
async function handlePaymentFailed(data: any, provider: string) {
  const { transactionId, error, errorCode } = data;

  // Find the transaction
  const transaction = await db.query.paymentTransactions.findFirst({
    where: and(
      eq(paymentTransactions.providerTransactionId, transactionId),
      eq(paymentTransactions.provider, provider)
    ),
    with: {
      order: true
    }
  });

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for webhook: ${transactionId}`);
    return;
  }

  // Update transaction status
  await db
    .update(paymentTransactions)
    .set({
      status: 'failed',
      failureReason: error,
      processedAt: new Date(),
      updatedAt: new Date(),
      providerResponse: data
    })
    .where(eq(paymentTransactions.id, transaction.id));

  // Update order status
  if (transaction.order) {
    const order = transaction.order as { id: string };
    await db
      .update(orders)
      .set({
        status: 'payment_failed',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));
  }

  console.log(`❌ Payment failed webhook processed: ${transactionId}`);
}

// Handle payment processing
async function handlePaymentProcessing(data: any, provider: string) {
  const { transactionId } = data;

  // Find the transaction
  const transaction = await db.query.paymentTransactions.findFirst({
    where: and(
      eq(paymentTransactions.providerTransactionId, transactionId),
      eq(paymentTransactions.provider, provider)
    ),
    with: {
      order: true
    }
  });

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for webhook: ${transactionId}`);
    return;
  }

  // Update transaction status
  await db
    .update(paymentTransactions)
    .set({
      status: 'processing',
      updatedAt: new Date(),
      providerResponse: data
    })
    .where(eq(paymentTransactions.id, transaction.id));

  // Update order status
  if (transaction.order) {
    const order = transaction.order as { id: string };
    await db
      .update(orders)
      .set({
        status: 'processing',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));
  }

  console.log(`🔄 Payment processing webhook processed: ${transactionId}`);
}

// Handle successful refund
async function handleRefundSucceeded(data: any, provider: string) {
  const { transactionId, refundId, amount } = data;

  // Find the refund
  const refund = await db.query.refunds.findFirst({
    where: eq(refunds.refundTransactionId, refundId),
    with: {
      order: true
    }
  });

  if (!refund) {
    console.warn(`⚠️ Refund not found for webhook: ${refundId}`);
    return;
  }

  // Update refund status
  await db
    .update(refunds)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(refunds.id, refund.id));

  // Create refund transaction record
  await db.insert(paymentTransactions).values({
    orderId: refund.orderId,
    transactionId: `refund_${refundId}`,
    type: 'refund',
    amount: amount,
    currency: refund.currency,
    provider: provider,
    providerTransactionId: refundId,
    providerResponse: data,
    status: 'completed',
    processedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log(`✅ Refund succeeded webhook processed: ${refundId}`);
}

// Handle failed refund
async function handleRefundFailed(data: any, provider: string) {
  const { refundId, error, errorCode } = data;

  // Find the refund
  const refund = await db.query.refunds.findFirst({
    where: eq(refunds.refundTransactionId, refundId)
  });

  if (!refund) {
    console.warn(`⚠️ Refund not found for webhook: ${refundId}`);
    return;
  }

  // Update refund status
  await db
    .update(refunds)
    .set({
      status: 'rejected',
      processingNotes: `Refund failed: ${error}`,
      updatedAt: new Date()
    })
    .where(eq(refunds.id, refund.id));

  console.log(`❌ Refund failed webhook processed: ${refundId}`);
}

// Handle chargeback created
async function handleChargebackCreated(data: any, provider: string) {
  const { transactionId, amount, reason } = data;

  // Find the transaction
  const transaction = await db.query.paymentTransactions.findFirst({
    where: and(
      eq(paymentTransactions.providerTransactionId, transactionId),
      eq(paymentTransactions.provider, provider)
    ),
    with: {
      order: true
    }
  });

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for chargeback webhook: ${transactionId}`);
    return;
  }

  // Update order status
  if (transaction.order) {
    const order = transaction.order as { id: string };
    await db
      .update(orders)
      .set({
        status: 'disputed',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));
  }

  // Create chargeback transaction record
  await db.insert(paymentTransactions).values({
    orderId: transaction.orderId,
    transactionId: `chargeback_${Date.now()}`,
    type: 'chargeback',
    amount: amount,
    currency: transaction.currency,
    provider: provider,
    providerTransactionId: `cb_${transactionId}`,
    providerResponse: data,
    status: 'completed',
    processedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log(`⚠️ Chargeback created webhook processed: ${transactionId}`);
}

// Handle dispute created
async function handleDisputeCreated(data: any, provider: string) {
  const { transactionId, amount, reason } = data;

  // Find the transaction
  const transaction = await db.query.paymentTransactions.findFirst({
    where: and(
      eq(paymentTransactions.providerTransactionId, transactionId),
      eq(paymentTransactions.provider, provider)
    ),
    with: {
      order: true
    }
  });

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for dispute webhook: ${transactionId}`);
    return;
  }

  // Update order status
  if (transaction.order) {
    const order = transaction.order as { id: string };
    await db
      .update(orders)
      .set({
        status: 'disputed',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));
  }

  console.log(`⚠️ Dispute created webhook processed: ${transactionId}`);
}

// POST /api/payments/webhooks - Handle webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';
    const provider = request.headers.get('x-webhook-provider') || 'unknown';

    // Verify webhook signature
    const webhookSecret = process.env.WEBHOOK_SECRET || 'dev-webhook-secret';
    
    if (!verifyWebhookSignature(body, signature, webhookSecret, provider)) {
      console.warn('⚠️ Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event: WebhookEvent;
    try {
      const parsedBody = JSON.parse(body);
      event = {
        id: parsedBody.id || `webhook_${Date.now()}`,
        type: parsedBody.type,
        data: parsedBody.data,
        provider: provider as PaymentProvider,
        timestamp: new Date(parsedBody.timestamp || Date.now())
      };
    } catch (error) {
      console.error('❌ Invalid webhook payload:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Process the webhook event
    await processPaymentWebhook(event);

    console.log(`✅ Webhook processed successfully: ${event.type} from ${provider}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET /api/payments/webhooks - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment webhooks endpoint is active',
    timestamp: new Date().toISOString()
  });
}