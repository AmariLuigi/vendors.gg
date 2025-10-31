// Payment Notifications API Route
// Handles payment-related notifications for users

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentNotifications } from '@/lib/db/schema';
import { eq, and, desc, isNull, isNotNull } from 'drizzle-orm';
import { ApiResponse, PaginatedResponse } from '@/lib/types/payment';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  type: z.enum([
    'payment_received',
    'payment_failed',
    'order_created',
    'order_cancelled',
    'escrow_held',
    'escrow_released',
    'escrow_disputed',
    'refund_requested',
    'refund_processed',
    'dispute_created',
    'dispute_resolved'
  ]).optional(),
  isRead: z.enum(['true', 'false']).optional()
});

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1, 'At least one notification ID is required')
});

// GET /api/payments/notifications - Get payment notifications
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
    let whereConditions = [eq(paymentNotifications.userId, session.user.id)];

    if (query.type) {
      whereConditions.push(eq(paymentNotifications.type, query.type));
    }

    if (query.isRead) {
      if (query.isRead === 'true') {
        whereConditions.push(isNotNull(paymentNotifications.readAt));
      } else {
        whereConditions.push(isNull(paymentNotifications.readAt));
      }
    }

    // Get notifications
    const notifications = await db.query.paymentNotifications.findMany({
      where: and(...whereConditions),
      orderBy: [desc(paymentNotifications.createdAt)],
      limit,
      offset
    });

    // Get total count
    const totalNotifications = await db.query.paymentNotifications.findMany({
      where: and(...whereConditions),
      columns: { id: true }
    });

    const totalCount = totalNotifications.length;

    // Get unread count
    const unreadNotifications = await db.query.paymentNotifications.findMany({
      where: and(
        eq(paymentNotifications.userId, session.user.id),
        isNull(paymentNotifications.readAt)
      ),
      columns: { id: true }
    });

    const unreadCount = unreadNotifications.length;

    const response: PaginatedResponse<typeof notifications[0]> & { unreadCount: number } = {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      unreadCount
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get payment notifications error:', error);

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

// PATCH /api/payments/notifications - Mark notifications as read
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
    const validatedData = markReadSchema.parse(body);

    // Verify all notifications belong to the user
    const notifications = await db.query.paymentNotifications.findMany({
      where: and(
        eq(paymentNotifications.userId, session.user.id),
        // Note: In a real implementation, you'd use an 'in' operator here
        // For now, we'll filter in the application layer
      ),
      columns: { id: true, userId: true }
    });

    const userNotificationIds = notifications
      .filter(n => validatedData.notificationIds.includes(n.id))
      .map(n => n.id);

    if (userNotificationIds.length !== validatedData.notificationIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some notifications not found or access denied' },
        { status: 403 }
      );
    }

    // Mark notifications as read
    const updatePromises = userNotificationIds.map(id =>
      db
        .update(paymentNotifications)
        .set({
          readAt: new Date()
        })
        .where(eq(paymentNotifications.id, id))
    );

    await Promise.all(updatePromises);

    const response: ApiResponse = {
      success: true,
      message: `${userNotificationIds.length} notification(s) marked as read`,
      data: { updatedCount: userNotificationIds.length }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Mark notifications as read error:', error);

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

// POST /api/payments/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    // This endpoint is for internal system use only
    // In production, you might want to add API key authentication
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      data,
      priority = 'medium'
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const [notification] = await db.insert(paymentNotifications).values({
      userId,
      type,
      title,
      message,
      metadata: data || {}
    }).returning();

    const response: ApiResponse = {
      success: true,
      data: notification,
      message: 'Notification created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Create notification error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',') || [];

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notification IDs provided' },
        { status: 400 }
      );
    }

    // Verify all notifications belong to the user
    const notifications = await db.query.paymentNotifications.findMany({
      where: eq(paymentNotifications.userId, session.user.id),
      columns: { id: true, userId: true }
    });

    const userNotificationIds = notifications
      .filter(n => notificationIds.includes(n.id))
      .map(n => n.id);

    if (userNotificationIds.length !== notificationIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some notifications not found or access denied' },
        { status: 403 }
      );
    }

    // Delete notifications
    const deletePromises = userNotificationIds.map(id =>
      db.delete(paymentNotifications).where(eq(paymentNotifications.id, id))
    );

    await Promise.all(deletePromises);

    const response: ApiResponse = {
      success: true,
      message: `${userNotificationIds.length} notification(s) deleted`,
      data: { deletedCount: userNotificationIds.length }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Delete notifications error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}