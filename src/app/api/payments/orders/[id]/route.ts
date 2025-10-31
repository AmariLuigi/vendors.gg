// Individual Order API Route
// Handles specific order operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse, PaymentError } from '@/lib/types/payment';
import { z } from 'zod';

// Validation schemas
const updateOrderSchema = z.object({
  status: z.enum(['cancelled', 'delivered']).optional(),
  deliveryProof: z.array(z.any()).optional(),
  sellerNotes: z.string().optional(),
  buyerNotes: z.string().optional(),
  deliveryInstructions: z.string().optional()
});

// GET /api/payments/orders/[id] - Get specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = id;

    // Get order with related data
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        listing: {
          columns: { id: true, title: true, description: true, price: true, images: true }
        },
        buyer: {
          columns: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        },
        seller: {
          columns: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        },
        conversation: {
          columns: { id: true }
        },
        transactions: {
          columns: { id: true, transactionId: true, amount: true, status: true, createdAt: true }
        },
        escrowHolds: {
          columns: { id: true, amount: true, status: true, autoReleaseAt: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this order
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: order
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/orders/[id] - Update order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = id;
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    // Get existing order
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isBuyer = existingOrder.buyerId === session.user.id;
    const isSeller = existingOrder.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate status transitions
    if (validatedData.status) {
      if (validatedData.status === 'cancelled') {
        // Only allow cancellation if order is pending or paid
        if (!existingOrder.status || !['pending', 'paid'].includes(existingOrder.status)) {
          return NextResponse.json(
            { success: false, error: 'Order cannot be cancelled in current status' },
            { status: 400 }
          );
        }
        // Both buyer and seller can cancel pending orders, only buyer can cancel paid orders
        if (existingOrder.status === 'paid' && !isBuyer) {
          return NextResponse.json(
            { success: false, error: 'Only buyer can cancel paid orders' },
            { status: 403 }
          );
        }
      }

      if (validatedData.status === 'delivered') {
        // Only seller can mark as delivered
        if (!isSeller) {
          return NextResponse.json(
            { success: false, error: 'Only seller can mark order as delivered' },
            { status: 403 }
          );
        }
        // Order must be paid or processing
        if (!existingOrder.status || !['paid', 'processing'].includes(existingOrder.status)) {
          return NextResponse.json(
            { success: false, error: 'Order must be paid or processing to mark as delivered' },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
      updateData.deliveryStatus = validatedData.status === 'delivered' ? 'delivered' : existingOrder.deliveryStatus;
      
      if (validatedData.status === 'cancelled') {
        updateData.cancelledAt = new Date();
      } else if (validatedData.status === 'delivered') {
        updateData.deliveredAt = new Date();
      }
    }

    if (validatedData.deliveryProof) {
      updateData.deliveryProof = validatedData.deliveryProof;
    }

    if (validatedData.sellerNotes && isSeller) {
      updateData.sellerNotes = validatedData.sellerNotes;
    }

    if (validatedData.buyerNotes && isBuyer) {
      updateData.buyerNotes = validatedData.buyerNotes;
    }

    if (validatedData.deliveryInstructions && isBuyer) {
      updateData.deliveryInstructions = validatedData.deliveryInstructions;
    }

    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Update order error:', error);

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

// DELETE /api/payments/orders/[id] - Cancel order (alternative to PATCH)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = id;

    // Get existing order
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isBuyer = existingOrder.buyerId === session.user.id;
    const isSeller = existingOrder.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate cancellation
    if (!existingOrder.status || !['pending', 'paid'].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    if (existingOrder.status === 'paid' && !isBuyer) {
      return NextResponse.json(
        { success: false, error: 'Only buyer can cancel paid orders' },
        { status: 403 }
      );
    }

    // Cancel order
    const [cancelledOrder] = await db
      .update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: cancelledOrder,
      message: 'Order cancelled successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}