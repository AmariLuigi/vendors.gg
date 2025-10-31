// Payment Methods API Route
// Handles payment method management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentMethods } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ApiResponse, PaymentError } from '@/lib/types/payment';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';
import { z } from 'zod';

// Validation schemas
const createPaymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'paypal', 'crypto', 'bank_transfer']),
  provider: z.enum(['mock', 'stripe', 'paypal', 'coinbase', 'bank_transfer']).optional(),
  maskedDetails: z.object({
    last4: z.string().optional(),
    brand: z.string().optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).optional(),
    holderName: z.string().optional()
  }).optional(),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(2)
  }).optional(),
  isDefault: z.boolean().optional().default(false)
});

const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid(),
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

// GET /api/payments/methods - Get user payment methods
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
    const activeOnly = searchParams.get('active') === 'true';

    // Build where conditions
    let whereConditions = [eq(paymentMethods.userId, session.user.id)];
    
    if (activeOnly) {
      whereConditions.push(eq(paymentMethods.isActive, true));
    }

    // Get payment methods
    const userPaymentMethods = await db.query.paymentMethods.findMany({
      where: and(...whereConditions),
      orderBy: [desc(paymentMethods.isDefault), desc(paymentMethods.createdAt)]
    });

    const response: ApiResponse = {
      success: true,
      data: userPaymentMethods
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get payment methods error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/methods - Update payment method
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
    const { paymentMethodId, ...updates } = updatePaymentMethodSchema.parse(body);

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Update payment method
    const updatedMethod = await db
      .update(paymentMethods)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, session.user.id)
        )
      )
      .returning();

    if (updatedMethod.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMethod[0],
      message: 'Payment method updated successfully'
    });

  } catch (error) {
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

// DELETE /api/payments/methods - Delete payment method
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
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Delete payment method
    const deletedMethod = await db
      .delete(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, session.user.id)
        )
      )
      .returning();

    if (deletedMethod.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/methods - Add new payment method
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
    const validatedData = createPaymentMethodSchema.parse(body);

    // Get payment provider for validation
    const paymentProvider = getPaymentProvider(validatedData.provider);

    // Validate payment method with provider
    const isValid = await paymentProvider.validatePaymentMethod({
      type: validatedData.type,
      maskedDetails: validatedData.maskedDetails
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method details' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other default methods
    if (validatedData.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(paymentMethods.userId, session.user.id),
          eq(paymentMethods.isDefault, true)
        ));
    }

    // Create payment method
    const [newPaymentMethod] = await db.insert(paymentMethods).values({
      userId: session.user.id,
      type: validatedData.type,
      provider: validatedData.provider || paymentProvider.name,
      isDefault: validatedData.isDefault,
      isActive: true,
      maskedDetails: validatedData.maskedDetails,
      billingAddress: validatedData.billingAddress,
      isVerified: true, // Mock verification for now
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const response: ApiResponse = {
      success: true,
      data: newPaymentMethod,
      message: 'Payment method added successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('❌ Create payment method error:', error);

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