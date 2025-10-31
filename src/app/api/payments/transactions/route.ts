// Transaction Management API Route
// Handles payment transaction lifecycle and status management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentTransactions, orders, escrowHolds, refunds, paymentNotifications } from '@/lib/db/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { ApiResponse, PaginatedResponse, TransactionStatus, PaymentStatus, PaymentProvider, Currency } from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { EscrowService } from '@/lib/services/escrow/escrow-service';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded']).optional(),
  type: z.enum(['payment', 'refund', 'escrow_release', 'escrow_refund']).optional(),
  orderId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const updateTransactionSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded']),
  notes: z.string().optional(),
});

const retryTransactionSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  reason: z.string().min(1, 'Retry reason is required'),
});

// GET /api/payments/transactions - Get user's transactions
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

    // Build where conditions
    let whereConditions = [];

    if (query.status) {
      whereConditions.push(eq(paymentTransactions.status, query.status as TransactionStatus));
    }

    if (query.type) {
      whereConditions.push(eq(paymentTransactions.type, query.type as any));
    }

    if (query.orderId) {
      whereConditions.push(eq(paymentTransactions.orderId, query.orderId));
    }

    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      whereConditions.push(eq(paymentTransactions.createdAt, fromDate));
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      whereConditions.push(eq(paymentTransactions.createdAt, toDate));
    }

    // Get transactions with related data
    const transactions = await db.query.paymentTransactions.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: {
          with: {
            buyer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            seller: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            listing: {
              columns: {
                id: true,
                title: true,
                price: true,
                images: true,
              }
            }
          }
        },
        escrowHolds: true,
        originalRefunds: true,
      },
      orderBy: [desc(paymentTransactions.createdAt)],
      limit,
      offset,
    });

    // Filter transactions where user is involved (buyer or seller)
    const userTransactions = transactions.filter(transaction => {
      return transaction.order?.buyerId === session.user.id || transaction.order?.sellerId === session.user.id;
    });

    // Get total count for pagination
    const totalCount = await db.query.paymentTransactions.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: true,
      }
    });

    const userTotalCount = totalCount.filter(transaction => {
      return transaction.order?.buyerId === session.user.id || transaction.order?.sellerId === session.user.id;
    }).length;

    const response: PaginatedResponse<typeof userTransactions[0]> = {
      success: true,
      data: userTransactions,
      pagination: {
        page,
        limit,
        total: userTotalCount,
        totalPages: Math.ceil(userTotalCount / limit),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/transactions - Perform transaction operations
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
    const { action } = body;

    switch (action) {
      case 'update_status':
        return await handleUpdateTransactionStatus(body, session.user.id);
      
      case 'retry':
        return await handleRetryTransaction(body, session.user.id);
      
      case 'cancel':
        return await handleCancelTransaction(body, session.user.id);
      
      case 'get_details':
        return await handleGetTransactionDetails(body, session.user.id);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Transaction operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle transaction status update
async function handleUpdateTransactionStatus(
  body: any, 
  userId: string
): Promise<NextResponse> {
  try {
    const validatedData = updateTransactionSchema.parse(body);

    // Verify user has permission to update transaction
    const transaction = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.id, validatedData.transactionId),
      with: {
        order: true,
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only involved parties can update transaction status
    if (transaction.order?.buyerId !== userId && transaction.order?.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this transaction' },
        { status: 403 }
      );
    }

    // Update transaction status
    await db.update(paymentTransactions)
      .set({
        status: validatedData.status,
        updatedAt: new Date(),
        ...(validatedData.notes && { metadata: { notes: validatedData.notes } })
      })
      .where(eq(paymentTransactions.id, validatedData.transactionId));

    // Create notification for status change
    await db.insert(paymentNotifications).values({
      userId: transaction.order?.buyerId === userId ? transaction.order?.sellerId : transaction.order?.buyerId,
      type: 'transaction_status_changed',
      title: 'Transaction Status Updated',
      message: `Transaction status changed to ${validatedData.status}`,
      metadata: {
        transactionId: validatedData.transactionId,
        newStatus: validatedData.status,
        updatedBy: userId,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction status updated successfully'
    });

  } catch (error) {
    console.error('❌ Update transaction status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 400 }
    );
  }
}

// Handle transaction retry
async function handleRetryTransaction(
  body: any, 
  userId: string
): Promise<NextResponse> {
  try {
    const validatedData = retryTransactionSchema.parse(body);

    // Get transaction details
    const transaction = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.id, validatedData.transactionId),
      with: {
        order: true,
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only buyer can retry failed transactions
    if (transaction.order?.buyerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to retry this transaction' },
        { status: 403 }
      );
    }

    // Check if transaction can be retried
    if (!['failed', 'cancelled'].includes(transaction.status)) {
      return NextResponse.json(
        { success: false, error: 'Transaction cannot be retried in current status' },
        { status: 400 }
      );
    }

    // Get payment provider and retry transaction
    const paymentProvider = getPaymentProvider(transaction.provider as PaymentProvider);
    
    const retryResult = await paymentProvider.processPayment({
      amount: parseFloat(transaction.amount),
      currency: transaction.currency as Currency,
      paymentMethodId: transaction.paymentMethodId || '',
      orderId: transaction.orderId,
      metadata: {
        ...(transaction.providerResponse as Record<string, any> || {}),
        retryReason: validatedData.reason,
        originalTransactionId: validatedData.transactionId,
      }
    });

    // Update original transaction
    await db.update(paymentTransactions)
      .set({
        status: 'processing',
        updatedAt: new Date(),
        providerResponse: {
          ...(transaction.providerResponse as Record<string, any> || {}),
          retryAttempt: true,
          retryReason: validatedData.reason,
        }
      })
      .where(eq(paymentTransactions.id, validatedData.transactionId));

    return NextResponse.json({
      success: true,
      message: 'Transaction retry initiated successfully',
      data: {
        newTransactionId: retryResult.transactionId,
        status: retryResult.status,
      }
    });

  } catch (error) {
    console.error('❌ Retry transaction error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 400 }
    );
  }
}

// Handle transaction cancellation
async function handleCancelTransaction(
  body: any, 
  userId: string
): Promise<NextResponse> {
  try {
    const { transactionId, reason } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get transaction details
    const transaction = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.id, transactionId),
      with: {
        order: true,
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only buyer can cancel pending transactions
    if (transaction.order?.buyerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this transaction' },
        { status: 403 }
      );
    }

    // Check if transaction can be cancelled
    if (!['pending', 'processing'].includes(transaction.status)) {
      return NextResponse.json(
        { success: false, error: 'Transaction cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // Cancel transaction with payment provider
    const paymentProvider = getPaymentProvider(transaction.provider as PaymentProvider);
    
    if (transaction.providerTransactionId) {
      await paymentProvider.refundPayment(
        transaction.providerTransactionId,
        parseFloat(transaction.amount)
      );
    }

    // Update transaction status
    await db.update(paymentTransactions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        providerResponse: {
          ...(transaction.providerResponse as Record<string, any> || {}),
          cancellationReason: reason,
          cancelledBy: userId,
        }
      })
      .where(eq(paymentTransactions.id, transactionId));

    return NextResponse.json({
      success: true,
      message: 'Transaction cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Cancel transaction error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' },
      { status: 400 }
    );
  }
}

// Handle get transaction details
async function handleGetTransactionDetails(
  body: any, 
  userId: string
): Promise<NextResponse> {
  try {
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get detailed transaction information
    const transaction = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.id, transactionId),
      with: {
        order: {
          with: {
            buyer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            seller: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            listing: {
              columns: {
                id: true,
                title: true,
                description: true,
                price: true,
                images: true,
              }
            }
          }
        },
        escrowHolds: true,
        originalRefunds: true,
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify user has access to transaction details
    if (transaction.order?.buyerId !== userId && transaction.order?.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this transaction' },
        { status: 403 }
      );
    }

    // Get transaction status from payment provider
    let providerStatus = null;
    if (transaction.providerTransactionId) {
      try {
        const paymentProvider = getPaymentProvider(transaction.provider as PaymentProvider);
        providerStatus = await paymentProvider.getTransactionStatus(transaction.providerTransactionId);
      } catch (error) {
        console.warn('Could not fetch provider status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        providerStatus,
      }
    });

  } catch (error) {
    console.error('❌ Get transaction details error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get details' },
      { status: 400 }
    );
  }
}