import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages, accounts, listings } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET /api/conversations/[id] - Get a specific conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversationId = params.id;
    const userId = session.user.id; // Use authenticated user's ID

    // Fetch conversation with participant details
    const conversation = await db
      .select({
        id: conversations.id,
        buyerId: conversations.buyerId,
        sellerId: conversations.sellerId,
        listingId: conversations.listingId,
        orderId: conversations.orderId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.buyerId, userId),
            eq(conversations.sellerId, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch participants
    const [buyer, seller] = await Promise.all([
      db
        .select({
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          avatar: accounts.avatar,
          rating: accounts.rating,
        })
        .from(accounts)
        .where(eq(accounts.id, conversation[0].buyerId))
        .limit(1),
      db
        .select({
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          avatar: accounts.avatar,
          rating: accounts.rating,
        })
        .from(accounts)
        .where(eq(accounts.id, conversation[0].sellerId))
        .limit(1)
    ]);

    // Fetch listing if exists
    let listing = null;
    if (conversation[0].listingId) {
      const listingResult = await db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          currency: listings.currency,
          images: listings.images,
          status: listings.status,
        })
        .from(listings)
        .where(eq(listings.id, conversation[0].listingId))
        .limit(1);
      
      listing = listingResult[0] || null;
    }

    // Fetch messages
    const conversationMessages = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        isRead: messages.isRead,
        readAt: messages.readAt,
        editedAt: messages.editedAt,
        createdAt: messages.createdAt,
        sender: {
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          avatar: accounts.avatar,
        }
      })
      .from(messages)
      .leftJoin(accounts, eq(messages.senderId, accounts.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    // Mark messages as read for the current user
    await db
      .update(messages)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isRead, false),
          // Don't mark own messages as read
          eq(messages.senderId, userId === conversation[0].buyerId ? conversation[0].sellerId : conversation[0].buyerId)
        )
      );

    const response = {
      ...conversation[0],
      buyer: buyer[0] || null,
      seller: seller[0] || null,
      listing,
      messages: conversationMessages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Update conversation status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversationId = params.id;
    const body = await request.json();
    const { status } = body;
    const userId = session.user.id; // Use authenticated user's ID

    // Verify user is part of the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.buyerId, userId),
            eq(conversations.sellerId, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Update conversation
    const updatedConversation = await db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    return NextResponse.json({
      conversation: updatedConversation[0],
      message: 'Conversation updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Archive/delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversationId = params.id;
    const userId = session.user.id;

    // Verify user is part of the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.buyerId, userId),
            eq(conversations.sellerId, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Archive conversation instead of deleting
    await db
      .update(conversations)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}