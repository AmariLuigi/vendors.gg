'use client';

import { conversationsAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<Conversation[], Error>({
    queryKey: ['conversations'],
    queryFn: conversationsAPI.getAll,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const conversations = Array.isArray(data) ? data : [];

  const activeChatsCount = conversations.filter((conv) => conv.status === 'active').length;

  const unreadMessagesCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  return {
    conversations,
    loading: isLoading,
    error: error ? (error.message || 'Failed to load conversations') : null,
    activeChatsCount,
    unreadMessagesCount,
    refetch: async () => {
      await refetch();
    },
  };
}