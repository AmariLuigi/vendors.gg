// Escrow API Route
// Handles escrow holds and releases for secure transactions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { escrowHolds, orders, paymentTransactions, paymentNotifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ApiResponse, PaginatedResponse, PaymentError, Currency } from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { z } from 'zod';

// Validation schemas
const releaseEscrowSchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID'),
  releaseAmount: z.number().positive('Release amount must be positive').optional(),
  releaseReason: z.string().min(1, 'Release reason is required'),
  releaseNotes: z.string().optional()
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['held', 'partial_release', 'released', 'disputed']).optional(),
  orderId: z.string().uuid().optional()
});

// GET /api/payments/escrow - Get escrow holds
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
      whereConditions.push(eq(escrowHolds.status, query.status));
    }

    if (query.orderId) {
      whereConditions.push(eq(escrowHolds.orderId, query.orderId));
    }

    // Get escrow holds with related data
    const userEscrowHolds = await db.query.escrowHolds.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: {
          columns: { 
            id: true, 
            orderNumber: true, 
            buyerId: true, 
            sellerId: true, 
            totalAmount: true,
            status: true,
            deliveryStatus: true
          },
          with: {
            listing: {
              columns: { id: true, title: true }
            },
            buyer: {
              columns: { id: true, firstName: true, lastName: true, avatar: true }
            },
            seller: {
              columns: { id: true, firstName: true, lastName: true, avatar: true }
            }
          }
        },
        releasedBy: {
          columns: { id: true, firstName: true, lastName: true, avatar: true }
        }
      },
      orderBy: [desc(escrowHolds.createdAt)],
      limit,
      offset
    });

    // Filter escrow holds to only show those the user is involved in
    const filteredEscrowHolds = userEscrowHolds.filter(escrow => {
      const order = escrow.order;
      return (
        (order && typeof order === 'object' && 'buyerId' in order && order.buyerId === session.user.id) ||
        (order && typeof order === 'object' && 'sellerId' in order && order.sellerId === session.user.id) ||
        escrow.releasedBy === session.user.id
      );
    });

    // Get total count
    const totalEscrowHolds = await db.query.escrowHolds.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        order: {
          columns: { buyerId: true, sellerId: true }
        }
      }
    });

    const totalCount = totalEscrowHolds.filter(escrow => {
      const order = escrow.order;
      return (
        (order && typeof order === 'object' && 'buyerId' in order && order.buyerId === session.user.id) ||
        (order && typeof order === 'object' && 'sellerId' in order && order.sellerId === session.user.id) ||
        escrow.releasedBy === session.user.id
      );
    }).length;

    const response: PaginatedResponse<typeof filteredEscrowHolds[0]> = {
      success: true,
      data: filteredEscrowHolds,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get escrow holds error:', error);

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

// POST /api/payments/escrow - Release escrow (buyer action)
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
    const validatedData = releaseEscrowSchema.parse(body);

    // Get escrow hold details
    const escrowHold = await db.query.escrowHolds.findFirst({
      where: eq(escrowHolds.id, validatedData.escrowId),
      with: {
        order: {
          with: {
            seller: {
              columns: { id: true, firstName: true, lastName: true, email: true }
            },
            buyer: {
              columns: { id: true, firstName: true, lastName: true, email: true }
            },
            listing: {
              columns: { id: true, title: true }
            }
          }
        }
      }
    });

    if (!escrowHold) {
      return NextResponse.json(
        { success: false, error: 'Escrow hold not found' },
        { status: 404 }
      );
    }

    // Check if user can release escrow (only buyer can release)
    const order = escrowHold.order;
    if (!(order && typeof order === 'object' && 'buyerId' in order && order.buyerId === session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Only the buyer can release escrow funds' },
        { status: 403 }
      );
    }

    // Check if escrow is in a releasable state
    if (!escrowHold.status || !['held', 'partial_release'].includes(escrowHold.status)) {
      return NextResponse.json(
        { success: false, error: 'Escrow is not in a releasable state' },
        { status: 400 }
      );
    }

    // Check if order is delivered
    const releaseOrder = escrowHold.order;
    if (!(releaseOrder && typeof releaseOrder === 'object' && 'deliveryStatus' in releaseOrder && releaseOrder.deliveryStatus === 'delivered')) {
      return NextResponse.json(
        { success: false, error: 'Order must be delivered before releasing escrow' },
        { status: 400 }
      );
    }

    // Determine release amount (full amount only)
    const escrowAmount = Number(escrowHold.amount) || 0;
    const releaseAmount = validatedData.releaseAmount || escrowAmount;
    
    if (releaseAmount > escrowAmount) {
      return NextResponse.json(
        { success: false, error: 'Release amount exceeds escrow balance' },
        { status: 400 }
      );
    }

    // For this implementation, we only support full releases
    if (releaseAmount !== escrowAmount) {
      return NextResponse.json(
        { success: false, error: 'Only full escrow releases are supported' },
        { status: 400 }
      );
    }

    try {
      // Process the escrow release with payment provider
      const paymentProvider = getPaymentProvider('mock'); // Use configured provider
      
      // In a real implementation, this would transfer funds to the seller
      const releaseResponse = await paymentProvider.processPayment({
        amount: releaseAmount,
        currency: (escrowHold.currency as Currency) || 'USD',
        paymentMethodId: 'escrow_release',
        orderId: escrowHold.orderId,
        description: `Escrow release for order ${releaseOrder && typeof releaseOrder === 'object' && 'orderNumber' in releaseOrder ? releaseOrder.orderNumber : 'unknown'}`,
        metadata: {
          escrowId: escrowHold.id,
          releaseReason: validatedData.releaseReason,
          sellerId: releaseOrder && typeof releaseOrder === 'object' && 'sellerId' in releaseOrder ? releaseOrder.sellerId : null
        }
      });

      if (!releaseResponse.success) {
        throw new PaymentError(
          releaseResponse.error || 'Escrow release failed',
          'ESCROW_RELEASE_FAILED',
          400
        );
      }

      // Update escrow hold
      const [updatedEscrowHold] = await db
        .update(escrowHolds)
        .set({
          status: 'released',
          releasedBy: session.user.id,
          releaseReason: validatedData.releaseReason,
          releasedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(escrowHolds.id, validatedData.escrowId))
        .returning();

      // Create release transaction record
      await db.insert(paymentTransactions).values({
        orderId: escrowHold.orderId,
        transactionId: releaseResponse.transactionId || `escrow_release_${Date.now()}`,
        type: 'escrow_release',
        amount: releaseAmount.toString(),
        currency: (escrowHold.currency as Currency) || 'USD',
        provider: paymentProvider.name,
        providerTransactionId: releaseResponse.transactionId,
        providerResponse: releaseResponse,
        status: 'completed',
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update order status (since this is a full release)
      await db
        .update(orders)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, escrowHold.orderId));

      // Create notification for seller
      await db.insert(paymentNotifications).values({
        userId: releaseOrder && typeof releaseOrder === 'object' && 'sellerId' in releaseOrder ? releaseOrder.sellerId : '',
        orderId: escrowHold.orderId,
        type: 'escrow_released',
        title: 'Escrow Funds Released',
        message: `${releaseAmount} ${(escrowHold.currency as Currency) || 'USD'} has been released from escrow for order ${releaseOrder && typeof releaseOrder === 'object' && 'orderNumber' in releaseOrder ? releaseOrder.orderNumber : 'unknown'}`,
        metadata: {
          orderId: escrowHold.orderId,
          escrowId: escrowHold.id,
          amount: releaseAmount,
          currency: (escrowHold.currency as Currency) || 'USD',
          isFullRelease: true
        }
      });

      // Create notification for buyer
      await db.insert(paymentNotifications).values({
        userId: session.user.id,
        orderId: escrowHold.orderId,
        type: 'escrow_released',
        title: 'Escrow Funds Released',
        message: `You have successfully released ${releaseAmount} ${(escrowHold.currency as Currency) || 'USD'} from escrow to the seller`,
        metadata: {
          orderId: escrowHold.orderId,
          escrowId: escrowHold.id,
          amount: releaseAmount,
          currency: (escrowHold.currency as Currency) || 'USD',
          isFullRelease: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: updatedEscrowHold,
        message: 'Escrow released successfully'
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('❌ Escrow release processing error:', error);
      
      if (error instanceof PaymentError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Release escrow error:', error);

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

// PATCH /api/payments/escrow - Dispute escrow (seller action)
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
    const { escrowId, disputeReason, disputeNotes } = body;

    if (!escrowId || !disputeReason) {
      return NextResponse.json(
        { success: false, error: 'Escrow ID and dispute reason are required' },
        { status: 400 }
      );
    }

    // Get escrow hold details
    const escrowHold = await db.query.escrowHolds.findFirst({
      where: eq(escrowHolds.id, escrowId),
      with: {
        order: {
          with: {
            seller: {
              columns: { id: true, firstName: true, lastName: true, email: true }
            },
            buyer: {
              columns: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!escrowHold) {
      return NextResponse.json(
        { success: false, error: 'Escrow hold not found' },
        { status: 404 }
      );
    }

    // Check if user can dispute escrow (seller can dispute)
    const disputeOrder = escrowHold.order;
    if (!(disputeOrder && typeof disputeOrder === 'object' && 'sellerId' in disputeOrder && disputeOrder.sellerId === session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Only the seller can dispute escrow holds' },
        { status: 403 }
      );
    }

    // Check if escrow can be disputed
    if (!escrowHold.status || !['held', 'partial_release'].includes(escrowHold.status)) {
      return NextResponse.json(
        { success: false, error: 'Escrow cannot be disputed in its current state' },
        { status: 400 }
      );
    }

    // Update escrow hold to disputed status
    const [updatedEscrowHold] = await db
      .update(escrowHolds)
      .set({
        status: 'disputed',
        updatedAt: new Date()
      })
      .where(eq(escrowHolds.id, escrowId))
      .returning();

    // Update order status with dispute details
    await db
      .update(orders)
      .set({
        status: 'disputed',
        disputeReason: disputeReason,
        disputeDetails: disputeNotes,
        updatedAt: new Date()
      })
      .where(eq(orders.id, escrowHold.orderId));

    // Create notifications for both parties
    await db.insert(paymentNotifications).values([
      {
        userId: disputeOrder && typeof disputeOrder === 'object' && 'buyerId' in disputeOrder ? disputeOrder.buyerId : '',
        orderId: escrowHold.orderId,
        type: 'escrow_disputed',
        title: 'Escrow Disputed',
        message: `The seller has disputed the escrow for order ${disputeOrder && typeof disputeOrder === 'object' && 'orderNumber' in disputeOrder ? disputeOrder.orderNumber : 'unknown'}. Reason: ${disputeReason}`,
        metadata: {
          orderId: escrowHold.orderId,
          escrowId: escrowHold.id,
          disputeReason,
          disputeNotes
        }
      },
      {
        userId: session.user.id,
        orderId: escrowHold.orderId,
        type: 'escrow_disputed',
        title: 'Escrow Dispute Created',
        message: `You have successfully disputed the escrow for order ${disputeOrder && typeof disputeOrder === 'object' && 'orderNumber' in disputeOrder ? disputeOrder.orderNumber : 'unknown'}`,
        metadata: {
          orderId: escrowHold.orderId,
          escrowId: escrowHold.id,
          disputeReason,
          disputeNotes
        }
      }
    ]);

    const response: ApiResponse = {
      success: true,
      data: updatedEscrowHold,
      message: 'Escrow dispute created successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Dispute escrow error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}