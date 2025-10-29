import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages, accounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/conversations - Get all conversations for a user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id; // Use authenticated user's ID

    const userConversations = await db
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
        // Other participant info
        otherParticipant: {
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          avatar: accounts.avatar,
          rating: accounts.rating,
        },
        // Listing info
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        },
        // Last message preview
        lastMessage: {
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        }
      })
      .from(conversations)
      .leftJoin(
        accounts,
        or(
          and(eq(conversations.buyerId, userId), eq(accounts.id, conversations.sellerId)),
          and(eq(conversations.sellerId, userId), eq(accounts.id, conversations.buyerId))
        )
      )
      .leftJoin(listings, eq(conversations.listingId, listings.id))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(
        or(
          eq(conversations.buyerId, userId),
          eq(conversations.sellerId, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sellerId, listingId, orderId, initialMessage } = body;
    const buyerId = session.user.id; // Use authenticated user's ID

    // Validate required fields
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    if (buyerId === sellerId) {
      return NextResponse.json(
        { error: 'You cannot start a conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists for this listing
    if (listingId) {
      const existingConversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.buyerId, buyerId),
            eq(conversations.sellerId, sellerId),
            eq(conversations.listingId, listingId)
          )
        )
        .limit(1);

      if (existingConversation.length > 0) {
        return NextResponse.json(
          { 
            conversation: existingConversation[0],
            message: 'Conversation already exists'
          },
          { status: 200 }
        );
      }
    }

    // Create new conversation
    const newConversation = await db
      .insert(conversations)
      .values({
        buyerId,
        sellerId,
        listingId: listingId || null,
        orderId: orderId || null,
        status: 'active',
        lastMessageAt: new Date(),
      })
      .returning();

    // Send initial message if provided
    if (initialMessage && newConversation[0]) {
      await db
        .insert(messages)
        .values({
          conversationId: newConversation[0].id,
          senderId: buyerId, // Assuming buyer initiates the conversation
          content: initialMessage,
          messageType: 'text',
          isRead: false,
        });
    }

    // Fetch the complete conversation with related data
    const conversationWithDetails = await db
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
        buyer: {
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          avatar: accounts.avatar,
          rating: accounts.rating,
        },
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        }
      })
      .from(conversations)
      .leftJoin(accounts, eq(conversations.buyerId, accounts.id))
      .leftJoin(listings, eq(conversations.listingId, listings.id))
      .where(eq(conversations.id, newConversation[0].id))
      .limit(1);

    return NextResponse.json(
      { 
        conversation: conversationWithDetails[0],
        message: 'Conversation created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}