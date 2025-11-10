'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { motion } from 'framer-motion';
import { useConversations } from '@/hooks/useConversations';

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

export function ChatPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');

  const { conversations, loading, error, refetch } = useConversations();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationParam);
  
  // Get current user ID from session
  const currentUserId = session?.user?.id;

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      setSelectedConversation(conversationParam);
    }
  }, [conversationParam, conversations]);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversationId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleNewMessage = async (_conversationId: string, _message: any) => {
    // For now, just refetch to update last message from server
    await refetch();
  };

  const handleMarkAsRead = async (_conversationId: string) => {
    // TODO: call API to mark messages as read, then refetch
    await refetch();
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You need to be signed in to access chat</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => void refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-background"
    >
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-80 border-r border-border bg-card"
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          currentUserId={currentUserId || ''}
          onRefresh={() => void refetch()}
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