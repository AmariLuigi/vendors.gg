import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentProvider } from '@/lib/services/payment/payment-factory';

const createStripePaymentMethodSchema = z.object({
  number: z.string().min(12),
  exp_month: z.number().min(1).max(12),
  exp_year: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 20),
  cvc: z.string().min(3).max(4),
  name: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createStripePaymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid card details', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const paymentProvider = getPaymentProvider('stripe');
    if (!paymentProvider.createPaymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Stripe provider does not support payment method creation' },
        { status: 500 }
      );
    }
    const result = await paymentProvider.createPaymentMethod({
      type: 'card',
      cardDetails: {
        number: parsed.data.number,
        exp_month: parsed.data.exp_month,
        exp_year: parsed.data.exp_year,
        cvc: parsed.data.cvc,
        name: parsed.data.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        provider: 'stripe',
        maskedDetails: result.maskedDetails,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create Stripe payment method' },
      { status: 500 }
    );
  }
}