// Payment Orders API Route
// Handles order creation and management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, listings, accounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  CreateOrderRequest, 
  ApiResponse, 
  PaginatedResponse,
  PaymentError 
} from '@/lib/types/payment';
import { calculatePaymentFees, validatePaymentAmount } from '@/lib/services/payment/payment-factory';
import { z } from 'zod';

// Validation schemas
const createOrderSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  buyerNotes: z.string().optional(),
  deliveryInstructions: z.string().optional()
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['pending', 'paid', 'processing', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded']).optional(),
  role: z.enum(['buyer', 'seller']).optional()
});

// POST /api/payments/orders - Create new order
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
    const validatedData = createOrderSchema.parse(body);

    // Get listing details
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, validatedData.listingId),
      with: {
        seller: {
          columns: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot purchase your own listing' },
        { status: 400 }
      );
    }

    if (listing.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Listing is not active' },
        { status: 400 }
      );
    }

    if ((listing.quantity || 0) < validatedData.quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const unitPrice = parseFloat(listing.price);
    const subtotal = unitPrice * validatedData.quantity;

    if (!validatePaymentAmount(subtotal)) {
      return NextResponse.json(
        { success: false, error: 'Amount exceeds transaction limits' },
        { status: 400 }
      );
    }

    const fees = calculatePaymentFees(subtotal);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const orderResult = await db.insert(orders).values({
      orderNumber,
      buyerId: session.user.id,
      sellerId: listing.sellerId,
      listingId: validatedData.listingId,
      quantity: validatedData.quantity,
      unitPrice: unitPrice.toString(),
      totalAmount: fees.total.toString(),
      currency: 'USD',
      platformFee: fees.platformFee.toString(),
      processingFee: fees.processingFee.toString(),
      sellerAmount: fees.sellerAmount.toString(),
      status: 'pending',
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      buyerNotes: validatedData.buyerNotes,
      deliveryInstructions: validatedData.deliveryInstructions,
    }).returning();

    const newOrder = (orderResult as any[])[0];

    const response: ApiResponse = {
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Create order error:', error);

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

// PATCH /api/payments/orders - Update order status
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
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.sellerId, session.user.id)
        )
      )
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/payments/orders - Get user orders
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
    const limit = Math.min(parseInt(query.limit), 50); // Max 50 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (query.role === 'buyer') {
      whereConditions.push(eq(orders.buyerId, session.user.id));
    } else if (query.role === 'seller') {
      whereConditions.push(eq(orders.sellerId, session.user.id));
    } else {
      // Default: show both buyer and seller orders
      whereConditions.push(
        and(
          eq(orders.buyerId, session.user.id),
          eq(orders.sellerId, session.user.id)
        )
      );
    }

    if (query.status) {
      whereConditions.push(eq(orders.status, query.status));
    }

    // Get orders with related data
    const userOrders = await db.query.orders.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        listing: {
          columns: { id: true, title: true, price: true, images: true }
        },
        buyer: {
          columns: { id: true, firstName: true, lastName: true, avatar: true }
        },
        seller: {
          columns: { id: true, firstName: true, lastName: true, avatar: true }
        }
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset
    });

    // Get total count for pagination
    const totalCount = await db.query.orders.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      columns: { id: true }
    });

    const response: PaginatedResponse<typeof userOrders[0]> = {
      success: true,
      data: userOrders,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get orders error:', error);

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