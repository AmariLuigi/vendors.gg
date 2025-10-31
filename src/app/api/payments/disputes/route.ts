// Dispute Management API Route
// Handles dispute creation, messaging, and resolution

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService, DisputeCreationData, DisputeMessage, DisputeResolution } from '@/lib/services/dispute/dispute-service';
import { ApiResponse, PaginatedResponse } from '@/lib/types/payment';
import { z } from 'zod';

// Validation schemas
const createDisputeSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  escrowId: z.string().uuid().optional(),
  reason: z.enum([
    'item_not_received',
    'item_not_as_described', 
    'damaged_item',
    'wrong_item',
    'seller_not_responsive',
    'buyer_not_responsive',
    'payment_issue',
    'shipping_issue',
    'quality_issue',
    'other'
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requestedAmount: z.number().positive().optional(),
  evidence: z.array(z.object({
    type: z.enum(['image', 'document', 'message', 'tracking', 'receipt']),
    url: z.string().url(),
    description: z.string(),
  })).optional(),
});

const addMessageSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  message: z.string().min(1, 'Message cannot be empty'),
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'message', 'tracking', 'receipt']),
    url: z.string().url(),
    description: z.string(),
  })).optional(),
});

const escalateDisputeSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  reason: z.string().min(10, 'Escalation reason must be at least 10 characters'),
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  resolution: z.enum([
    'full_refund',
    'partial_refund',
    'replacement',
    'store_credit',
    'no_action',
    'favor_seller',
    'favor_buyer'
  ]),
  amount: z.number().positive().optional(),
  reason: z.string().min(10, 'Resolution reason must be at least 10 characters'),
  evidence: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['open', 'under_review', 'awaiting_response', 'escalated', 'resolved', 'closed']).optional(),
});

// GET /api/payments/disputes - Get user's disputes
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

    const disputeService = new DisputeService();
    const result = await disputeService.getUserDisputes(
      session.user.id,
      query.status as any,
      page,
      limit
    );

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.disputes,
      pagination: {
        page,
        limit,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / limit),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get disputes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/disputes - Perform dispute operations
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

    const disputeService = new DisputeService();

    switch (action) {
      case 'create':
        return await handleCreateDispute(body, session.user.id, disputeService);
      
      case 'add_message':
        return await handleAddMessage(body, session.user.id, disputeService);
      
      case 'escalate':
        return await handleEscalateDispute(body, session.user.id, disputeService);
      
      case 'resolve':
        return await handleResolveDispute(body, session.user.id, disputeService);
      
      case 'get_details':
        return await handleGetDisputeDetails(body, session.user.id, disputeService);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Dispute operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle dispute creation
async function handleCreateDispute(
  body: any,
  userId: string,
  disputeService: DisputeService
): Promise<NextResponse> {
  try {
    const validatedData = createDisputeSchema.parse(body);

    const disputeData: DisputeCreationData = {
      orderId: validatedData.orderId,
      escrowId: validatedData.escrowId,
      reason: validatedData.reason,
      description: validatedData.description,
      evidence: validatedData.evidence?.map(e => ({
        ...e,
        uploadedAt: new Date(),
      })),
      requestedAmount: validatedData.requestedAmount,
      createdBy: userId,
    };

    const disputeId = await disputeService.createDispute(disputeData);

    return NextResponse.json({
      success: true,
      message: 'Dispute created successfully',
      data: { disputeId }
    });

  } catch (error) {
    console.error('❌ Create dispute error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create dispute' },
      { status: 400 }
    );
  }
}

// Handle adding message to dispute
async function handleAddMessage(
  body: any,
  userId: string,
  disputeService: DisputeService
): Promise<NextResponse> {
  try {
    const validatedData = addMessageSchema.parse(body);

    const messageData: DisputeMessage = {
      disputeId: validatedData.disputeId,
      senderId: userId,
      message: validatedData.message,
      attachments: validatedData.attachments?.map(a => ({
        ...a,
        uploadedAt: new Date(),
      })),
    };

    await disputeService.addDisputeMessage(messageData);

    return NextResponse.json({
      success: true,
      message: 'Message added successfully'
    });

  } catch (error) {
    console.error('❌ Add dispute message error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add message' },
      { status: 400 }
    );
  }
}

// Handle dispute escalation
async function handleEscalateDispute(
  body: any,
  userId: string,
  disputeService: DisputeService
): Promise<NextResponse> {
  try {
    const validatedData = escalateDisputeSchema.parse(body);

    await disputeService.escalateDispute(
      validatedData.disputeId,
      userId,
      validatedData.reason
    );

    return NextResponse.json({
      success: true,
      message: 'Dispute escalated successfully'
    });

  } catch (error) {
    console.error('❌ Escalate dispute error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to escalate dispute' },
      { status: 400 }
    );
  }
}

// Handle dispute resolution
async function handleResolveDispute(
  body: any,
  userId: string,
  disputeService: DisputeService
): Promise<NextResponse> {
  try {
    const validatedData = resolveDisputeSchema.parse(body);

    // Note: In production, only admins/mediators should be able to resolve disputes
    // Add role-based authorization here

    const resolutionData: DisputeResolution = {
      disputeId: validatedData.disputeId,
      resolution: validatedData.resolution,
      amount: validatedData.amount,
      reason: validatedData.reason,
      resolvedBy: userId,
      evidence: validatedData.evidence,
    };

    await disputeService.resolveDispute(resolutionData);

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved successfully'
    });

  } catch (error) {
    console.error('❌ Resolve dispute error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to resolve dispute' },
      { status: 400 }
    );
  }
}

// Handle get dispute details
async function handleGetDisputeDetails(
  body: any,
  userId: string,
  disputeService: DisputeService
): Promise<NextResponse> {
  try {
    const { disputeId } = body;

    if (!disputeId) {
      return NextResponse.json(
        { success: false, error: 'Dispute ID is required' },
        { status: 400 }
      );
    }

    const dispute = await disputeService.getDispute(disputeId, userId);

    return NextResponse.json({
      success: true,
      data: dispute
    });

  } catch (error) {
    console.error('❌ Get dispute details error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get dispute details' },
      { status: 400 }
    );
  }
}