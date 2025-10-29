'use client';

import { useState, useEffect } from 'react';
import { conversationsAPI } from '@/lib/api';

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

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  activeChatsCount: number;
  unreadMessagesCount: number;
  refetch: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await conversationsAPI.getAll();
      
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error('Invalid conversations data:', data);
        setError('Failed to load conversations');
        setConversations([]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Calculate active chats count (conversations with status 'active')
  const activeChatsCount = conversations.filter(conv => conv.status === 'active').length;

  // Calculate total unread messages count
  const unreadMessagesCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  return {
    conversations,
    loading,
    error,
    activeChatsCount,
    unreadMessagesCount,
    refetch: fetchConversations,
  };
}