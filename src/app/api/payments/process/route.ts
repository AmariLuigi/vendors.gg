// Payment Processing API Route
// Handles payment processing and transaction management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, paymentTransactions, escrowHolds, paymentMethods } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  ProcessPaymentRequest, 
  ApiResponse, 
  PaymentError,
  SecurityContext,
  Currency
} from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { z } from 'zod';

// Validation schema
const processPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  savePaymentMethod: z.boolean().optional().default(false)
});

// POST /api/payments/process - Process payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = processPaymentSchema.parse(body);

    // Get order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, validatedData.orderId),
      with: {
        listing: {
          columns: { id: true, title: true, sellerId: true }
        },
        buyer: {
          columns: { id: true, firstName: true, lastName: true, email: true }
        },
        seller: {
          columns: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify buyer
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the buyer can process payment for this order' },
        { status: 403 }
      );
    }

    // Check order status
    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Order is not in a payable state' },
        { status: 400 }
      );
    }

    // Check if order has expired
    if (order.expiresAt && new Date() > order.expiresAt) {
      // Auto-cancel expired order
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, validatedData.orderId));

      return NextResponse.json(
        { success: false, error: 'Order has expired and been cancelled' },
        { status: 400 }
      );
    }

    // Get payment method (for validation)
    const paymentMethod = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.id, validatedData.paymentMethodId),
        eq(paymentMethods.userId, session.user.id),
        eq(paymentMethods.isActive, true)
      )
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive payment method' },
        { status: 400 }
      );
    }

    // Create security context
    const securityContext: SecurityContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: session.user.id // Simplified for now
    };

    // Get payment provider
    const paymentProvider = getPaymentProvider();

    // Map internal payment method to provider-specific identifier
    let providerPaymentMethodId = validatedData.paymentMethodId;
    if (paymentProvider.name === 'stripe') {
      const masked = (paymentMethod?.maskedDetails || {}) as { stripePaymentMethodId?: string };
      const stripeId = masked.stripePaymentMethodId;
      if (!stripeId) {
        return NextResponse.json(
          { success: false, error: 'Stripe payment method is not linked to a Stripe ID' },
          { status: 400 }
        );
      }
      providerPaymentMethodId = stripeId;
    }

    // Prepare payment request
    const paymentRequest = {
      orderId: order.id,
      paymentMethodId: providerPaymentMethodId,
      amount: parseFloat(order.totalAmount),
      currency: (order.currency || 'USD') as Currency,
      description: `Payment for ${order.listing?.title} (Order: ${order.orderNumber})`,
      metadata: {
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        listingId: order.listingId,
        securityContext
      }
    };

    // Process payment
    console.log('🔄 Processing payment for order:', order.orderNumber);
    const paymentResponse = await paymentProvider.processPayment(paymentRequest);

    // Create payment transaction record
    const [transaction] = await db.insert(paymentTransactions).values({
      orderId: order.id,
      paymentMethodId: validatedData.paymentMethodId,
      transactionId: paymentResponse.transactionId || `txn_${Date.now()}`,
      type: 'payment',
      amount: order.totalAmount,
      currency: order.currency,
      provider: paymentProvider.name,
      providerTransactionId: paymentResponse.transactionId,
      providerResponse: paymentResponse,
      status: paymentResponse.status,
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      processedAt: paymentResponse.status === 'completed' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Update order status based on payment result
    let orderUpdateData: any = {
      paymentStatus: paymentResponse.status,
      updatedAt: new Date()
    };

    if (paymentResponse.status === 'completed') {
      orderUpdateData.status = 'paid';
      orderUpdateData.paidAt = new Date();

      // Create escrow hold for successful payments
      await db.insert(escrowHolds).values({
        orderId: order.id,
        transactionId: transaction.id,
        amount: order.sellerAmount, // Hold seller amount in escrow
        currency: order.currency,
        status: 'held',
        autoReleaseAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        releaseCondition: 'auto_release_or_buyer_confirmation',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    } else if (paymentResponse.status === 'processing') {
      orderUpdateData.status = 'processing';
    }

    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set(orderUpdateData)
      .where(eq(orders.id, order.id))
      .returning();

    // Prepare response
    const response: ApiResponse = {
      success: paymentResponse.success,
      data: {
        order: updatedOrder,
        transaction,
        paymentResponse: {
          transactionId: paymentResponse.transactionId,
          status: paymentResponse.status,
          requiresAction: paymentResponse.requiresAction,
          clientSecret: paymentResponse.clientSecret,
          redirectUrl: paymentResponse.redirectUrl
        }
      },
      message: paymentResponse.success 
        ? 'Payment processed successfully' 
        : 'Payment processing initiated'
    };

    console.log('✅ Payment processing completed:', {
      orderId: order.id,
      transactionId: transaction.id,
      status: paymentResponse.status
    });

    return NextResponse.json(response, { 
      status: paymentResponse.success ? 200 : 202 
    });

  } catch (error) {
    console.error('❌ Payment processing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          message: error.issues[0]?.message 
        },
        { status: 400 }
      );
    }

    if (error instanceof PaymentError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code 
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}