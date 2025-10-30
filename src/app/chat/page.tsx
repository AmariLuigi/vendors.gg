'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { conversationsAPI } from '@/lib/api';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { motion } from 'framer-motion';

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  orderId?: string;
  status: string;
  lastMessageAt?: string;
  createdAt: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    images?: string[];
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount?: number;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user ID from session
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      setSelectedConversation(conversationParam);
    }
  }, [conversationParam, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await conversationsAPI.getAll();
      
      if (response.error) {
        setError(response.error);
      } else {
        // The API returns conversations array directly, not wrapped in an object
        setConversations(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleNewMessage = (conversationId: string, message: any) => {
    // Update the conversation's last message and timestamp
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          lastMessageAt: message.createdAt,
        };
      }
      return conv;
    }));
  };

  const handleMarkAsRead = (conversationId: string) => {
    // Reset unread count for the conversation
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    }));
  };

  // Show loading while session is loading
  if (!session && loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-screen bg-background"
      >
        <div className="flex items-center justify-center w-full">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          />
        </div>
      </motion.div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-screen bg-background"
      >
        <div className="flex items-center justify-center w-full">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-center"
          >
            <div className="text-muted-foreground mb-4">Please sign in to access your messages</div>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/login"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Sign In
            </motion.a>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-screen bg-background"
      >
        <div className="flex items-center justify-center w-full">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-screen bg-background"
      >
        <div className="flex items-center justify-center w-full">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-center"
          >
            <div className="text-destructive mb-2">Error loading conversations</div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadConversations}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-background"
    >
      {/* Chat Sidebar */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-80 bg-card border-r border-border flex flex-col"
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          currentUserId={currentUserId || ''}
          onRefresh={loadConversations}
        />
      </motion.div>

      {/* Chat Window */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex flex-col bg-background"
      >
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation}
            currentUserId={currentUserId || ''}
            onNewMessage={handleNewMessage}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <EmptyChat />
        )}
      </motion.div>
    </motion.div>
  );
}