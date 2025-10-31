// Refunds API Route
// Handles refund requests and processing

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { refunds, orders, paymentTransactions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ApiResponse, PaginatedResponse, PaymentError, PaymentProvider } from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { z } from 'zod';

// Validation schemas
const createRefundSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive').optional(),
  reason: z.string().min(1, 'Reason is required'),
  requestNotes: z.string().optional()
});

const processRefundSchema = z.object({
  refundId: z.string().uuid('Invalid refund ID'),
  status: z.enum(['approved', 'rejected']),
  processingNotes: z.string().optional()
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['pending', 'approved', 'processing', 'completed', 'rejected']).optional(),
  orderId: z.string().uuid().optional()
});

// GET /api/payments/refunds - Get refunds
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 50);
    const offset = (page - 1) * limit;

    // Build where conditions - user can see refunds for orders they're involved in
    let whereConditions = [];

    if (query.status) {
      whereConditions.push(eq(refunds.status, query.status));
    }

    if (query.orderId) {
      whereConditions.push(eq(refunds.orderId, query.orderId));
    }

    // Get refunds with related data
    const userRefunds = await db.query.refunds.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: {
          columns: { id: true, orderNumber: true, buyerId: true, sellerId: true, totalAmount: true },
          with: {
            listing: {
              columns: { id: true, title: true }
            }
          }
        },
        requestedBy: {
          columns: { id: true, firstName: true, lastName: true, avatar: true }
        },
        processedBy: {
          columns: { id: true, firstName: true, lastName: true, avatar: true }
        }
      },
      orderBy: [desc(refunds.createdAt)],
      limit,
      offset
    });

    // Filter refunds to only show those the user is involved in
    const filteredRefunds = userRefunds.filter(refund => {
      const order = refund.order as { id: string; buyerId: string; sellerId: string; orderNumber: string; totalAmount: string } | null;
      return (
        order?.buyerId === session.user.id || 
        order?.sellerId === session.user.id ||
        refund.requestedBy === session.user.id ||
        refund.processedBy === session.user.id
      );
    });

    // Get total count
    const totalRefunds = await db.query.refunds.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: {
          columns: { buyerId: true, sellerId: true }
        }
      }
    });

    const totalCount = totalRefunds.filter(refund => {
      const order = refund.order as { buyerId: string; sellerId: string } | null;
      return (
        order?.buyerId === session.user.id || 
        order?.sellerId === session.user.id ||
        refund.requestedBy === session.user.id ||
        refund.processedBy === session.user.id
      );
    }).length;

    const response: PaginatedResponse<typeof filteredRefunds[0]> = {
      success: true,
      data: filteredRefunds,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get refunds error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          message: error.issues[0]?.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/refunds - Request refund
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
    const validatedData = createRefundSchema.parse(body);

    // Get order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, validatedData.orderId),
      with: {
        transactions: {
          where: eq(paymentTransactions.type, 'payment'),
          orderBy: [desc(paymentTransactions.createdAt)],
          limit: 1
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user can request refund (buyer or seller)
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if order is refundable
    if (!order.status || !['paid', 'processing', 'delivered', 'completed'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order is not in a refundable state' },
        { status: 400 }
      );
    }

    // Check if there's already a pending refund
    const existingRefund = await db.query.refunds.findFirst({
      where: and(
        eq(refunds.orderId, validatedData.orderId),
        eq(refunds.status, 'pending')
      )
    });

    if (existingRefund) {
      return NextResponse.json(
        { success: false, error: 'There is already a pending refund for this order' },
        { status: 400 }
      );
    }

    // Determine refund amount
    const refundAmount = validatedData.amount ? validatedData.amount.toString() : order.totalAmount;
    
    if (parseFloat(refundAmount) > parseFloat(order.totalAmount)) {
      return NextResponse.json(
        { success: false, error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      );
    }

    // Get original transaction
    const originalTransaction = order.transactions[0];
    if (!originalTransaction) {
      return NextResponse.json(
        { success: false, error: 'No payment transaction found for this order' },
        { status: 400 }
      );
    }

    // Create refund request
    const [newRefund] = await db.insert(refunds).values({
      orderId: validatedData.orderId,
      originalTransactionId: originalTransaction.id,
      amount: refundAmount,
      currency: order.currency,
      reason: validatedData.reason,
      requestedBy: session.user.id,
      requestReason: validatedData.reason,
      requestNotes: validatedData.requestNotes,
      status: 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const response: ApiResponse = {
      success: true,
      data: newRefund,
      message: 'Refund request created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Create refund error:', error);

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

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/refunds - Process refund (admin/seller action)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = processRefundSchema.parse(body);

    // Get refund details
    const refund = await db.query.refunds.findFirst({
      where: eq(refunds.id, validatedData.refundId),
      with: {
        order: {
          columns: { id: true, sellerId: true, buyerId: true, status: true }
        },
        originalTransaction: {
          columns: { id: true, transactionId: true, provider: true }
        }
      }
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: 'Refund not found' },
        { status: 404 }
      );
    }

    // Check permissions (seller can approve/reject their own order refunds)
    const order = refund.order as { id: string; sellerId: string; buyerId: string; status: string } | null;
    if (order?.sellerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the seller can process this refund' },
        { status: 403 }
      );
    }

    // Check if refund is still pending
    if (refund.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Refund has already been processed' },
        { status: 400 }
      );
    }

    let updateData: any = {
      status: validatedData.status,
      processedBy: session.user.id,
      processingNotes: validatedData.processingNotes,
      processedAt: new Date(),
      updatedAt: new Date()
    };

    // If approved, process the actual refund
    if (validatedData.status === 'approved') {
      try {
        // Get payment provider
        const originalTransaction = refund.originalTransaction as { id: string; transactionId: string; provider: string } | null;
        const paymentProvider = getPaymentProvider(originalTransaction?.provider as PaymentProvider);

        // Process refund with payment provider
        const refundResponse = await paymentProvider.refundPayment(
          originalTransaction?.transactionId || '',
          parseFloat(refund.amount)
        );

        if (refundResponse.success) {
          updateData.status = 'processing';
          updateData.refundTransactionId = refundResponse.transactionId;

          // Create refund transaction record
          await db.insert(paymentTransactions).values({
            orderId: refund.orderId,
            transactionId: refundResponse.transactionId || `ref_${Date.now()}`,
            type: 'refund',
            amount: refund.amount,
            currency: refund.currency,
            provider: paymentProvider.name,
            providerTransactionId: refundResponse.transactionId,
            providerResponse: refundResponse,
            status: refundResponse.status,
            processedAt: refundResponse.status === 'completed' ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          if (refundResponse.status === 'completed') {
            updateData.status = 'completed';
            updateData.completedAt = new Date();
          }
        } else {
          updateData.status = 'rejected';
          updateData.processingNotes = `Refund processing failed: ${refundResponse.error}`;
        }
      } catch (error) {
        console.error('❌ Refund processing error:', error);
        updateData.status = 'rejected';
        updateData.processingNotes = `Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Update refund
    const [updatedRefund] = await db
      .update(refunds)
      .set(updateData)
      .where(eq(refunds.id, validatedData.refundId))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: updatedRefund,
      message: `Refund ${validatedData.status} successfully`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Process refund error:', error);

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
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}