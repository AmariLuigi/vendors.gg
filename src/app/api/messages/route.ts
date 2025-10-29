import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, conversations, accounts } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// POST /api/messages - Send a new message
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
    const { 
      conversationId, 
      content, 
      messageType = 'text', 
      attachments 
    } = body;
    const senderId = session.user.id; // Use authenticated user's ID

    // Validate required fields
    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Verify sender is part of the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.buyerId, senderId),
            eq(conversations.sellerId, senderId)
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

    // Check if conversation is active
    if (conversation[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot send messages to inactive conversation' },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType,
        attachments: attachments || null,
        isRead: false,
      })
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Fetch the complete message with sender details
    const messageWithSender = await db
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
      .where(eq(messages.id, newMessage[0].id))
      .limit(1);

    return NextResponse.json(
      {
        message: messageWithSender[0],
        success: 'Message sent successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/messages - Get messages for a conversation (with pagination)
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const userId = session.user.id; // Use authenticated user's ID

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

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

    // Fetch messages with pagination
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
      .orderBy(messages.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalMessages = await db
      .select({ count: messages.id })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const totalCount = totalMessages.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      messages: conversationMessages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}