import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages, accounts, listings } from '@/lib/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';

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

    // Get conversations for the user (simplified query to avoid duplicates)
    const rawConversations = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.buyerId, userId),
          eq(conversations.sellerId, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Transform the data to match frontend expectations
    const formattedConversations = await Promise.all(
      rawConversations.map(async (conv) => {
        // Get buyer, seller, listing info, and last message separately to avoid duplicates
        const [buyerInfo, sellerInfo, listingInfo, lastMessageInfo] = await Promise.all([
          db.select().from(accounts).where(eq(accounts.id, conv.buyerId)).limit(1),
          db.select().from(accounts).where(eq(accounts.id, conv.sellerId)).limit(1),
          conv.listingId ? db.select().from(listings).where(eq(listings.id, conv.listingId)).limit(1) : Promise.resolve([]),
          db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1)
        ]);

        return {
          id: conv.id,
          buyerId: conv.buyerId,
          sellerId: conv.sellerId,
          listingId: conv.listingId,
          orderId: conv.orderId,
          status: conv.status,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          buyer: buyerInfo[0] ? {
            id: buyerInfo[0].id,
            firstName: buyerInfo[0].firstName,
            lastName: buyerInfo[0].lastName,
            avatar: buyerInfo[0].avatar,
          } : null,
          seller: sellerInfo[0] ? {
            id: sellerInfo[0].id,
            firstName: sellerInfo[0].firstName,
            lastName: sellerInfo[0].lastName,
            avatar: sellerInfo[0].avatar,
          } : null,
          listing: listingInfo[0] ? {
            id: listingInfo[0].id,
            title: listingInfo[0].title,
            price: listingInfo[0].price,
            images: listingInfo[0].images,
          } : null,
          lastMessage: lastMessageInfo[0] ? {
            content: lastMessageInfo[0].content,
            senderId: lastMessageInfo[0].senderId,
            createdAt: lastMessageInfo[0].createdAt,
          } : null,
          unreadCount: 0, // TODO: Calculate actual unread count
        };
      })
    );

    return NextResponse.json(formattedConversations);
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