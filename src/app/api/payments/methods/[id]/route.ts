// Individual Payment Method API Route
// Handles specific payment method operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentMethods } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/types/payment';
import { z } from 'zod';

// Validation schema
const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(2)
  }).optional()
});

// GET /api/payments/methods/[id] - Get specific payment method
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

    const paymentMethodId = id;

    // Get payment method
    const paymentMethod = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id)
      )
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: paymentMethod
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get payment method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/methods/[id] - Update payment method
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

    const paymentMethodId = id;
    const body = await request.json();
    const validatedData = updatePaymentMethodSchema.parse(body);

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id)
      )
    });

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other default methods
    if (validatedData.isDefault === true) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(paymentMethods.userId, session.user.id),
          eq(paymentMethods.isDefault, true)
        ));
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (validatedData.isDefault !== undefined) {
      updateData.isDefault = validatedData.isDefault;
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    if (validatedData.billingAddress) {
      updateData.billingAddress = validatedData.billingAddress;
    }

    // Update payment method
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set(updateData)
      .where(and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id)
      ))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: updatedPaymentMethod,
      message: 'Payment method updated successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Update payment method error:', error);

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

// DELETE /api/payments/methods/[id] - Delete payment method
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

    const paymentMethodId = id;

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id)
      )
    });

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Check if there are any pending transactions using this payment method
    // This would require checking the paymentTransactions table
    // For now, we'll just soft delete by setting isActive to false

    const [deletedPaymentMethod] = await db
      .update(paymentMethods)
      .set({
        isActive: false,
        isDefault: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id)
      ))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: deletedPaymentMethod,
      message: 'Payment method deleted successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Delete payment method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}