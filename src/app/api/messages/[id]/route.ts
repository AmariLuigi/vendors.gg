import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, conversations, accounts } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// PUT /api/messages/[id] - Update a message (edit content)
export async function PUT(
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

    const messageId = params.id;
    const body = await request.json();
    const { content } = body;
    const userId = session.user.id;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Fetch the message and verify ownership
    const message = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user is the sender
    if (message[0].senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message[0].createdAt).getTime();
    const maxEditTime = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (messageAge > maxEditTime) {
      return NextResponse.json(
        { error: 'Message is too old to edit' },
        { status: 400 }
      );
    }

    // Update the message
    const updatedMessage = await db
      .update(messages)
      .set({
        content,
        editedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    // Fetch the complete updated message with sender details
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
      .where(eq(messages.id, messageId))
      .limit(1);

    return NextResponse.json({
      message: messageWithSender[0],
      success: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message
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

    const messageId = params.id;
    const userId = session.user.id;

    // Fetch the message and verify ownership
    const message = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user is the sender
    if (message[0].senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Check if message is too old to delete (e.g., 1 hour)
    const messageAge = Date.now() - new Date(message[0].createdAt).getTime();
    const maxDeleteTime = 60 * 60 * 1000; // 1 hour in milliseconds

    if (messageAge > maxDeleteTime) {
      return NextResponse.json(
        { error: 'Message is too old to delete' },
        { status: 400 }
      );
    }

    // Instead of actually deleting, we'll update the content to indicate deletion
    // This preserves conversation flow while removing the content
    await db
      .update(messages)
      .set({
        content: '[This message was deleted]',
        messageType: 'deleted',
        editedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    return NextResponse.json({
      success: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[id] - Mark message as read
export async function PATCH(
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

    const messageId = params.id;
    const userId = session.user.id;

    // Fetch the message and conversation to verify access
    const messageWithConversation = await db
      .select({
        messageId: messages.id,
        senderId: messages.senderId,
        conversationId: messages.conversationId,
        buyerId: conversations.buyerId,
        sellerId: conversations.sellerId,
      })
      .from(messages)
      .leftJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.id, messageId))
      .limit(1);

    if (messageWithConversation.length === 0) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const messageData = messageWithConversation[0];

    // Verify user is part of the conversation and not the sender
    const isParticipant = messageData.buyerId === userId || messageData.sellerId === userId;
    const isSender = messageData.senderId === userId;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (isSender) {
      return NextResponse.json(
        { error: 'Cannot mark your own message as read' },
        { status: 400 }
      );
    }

    // Mark message as read
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    return NextResponse.json({
      success: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}