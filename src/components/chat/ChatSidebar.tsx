'use client';

import { useState } from 'react';
import { Search, MessageCircle, RefreshCw, Filter } from 'lucide-react';

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

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  currentUserId: string;
  onRefresh: () => void;
}

export function ChatSidebar({
  conversations,
  selectedConversation,
  onConversationSelect,
  currentUserId,
  onRefresh
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const filteredConversations = conversations.filter(conversation => {
    // Get the other participant (not current user)
    const otherParticipant = conversation.buyerId === currentUserId 
      ? conversation.seller 
      : conversation.buyer;
    
    const participantName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
    const listingTitle = conversation.listing?.title?.toLowerCase() || '';
    
    const matchesSearch = searchTerm === '' || 
      participantName.includes(searchTerm.toLowerCase()) ||
      listingTitle.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Messages
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1 focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {conversations.length === 0 ? (
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a conversation with a seller!</p>
              </div>
            ) : (
              <p>No conversations match your search</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.buyerId === currentUserId 
                ? conversation.seller 
                : conversation.buyer;
              
              const isSelected = selectedConversation === conversation.id;
              const hasUnread = (conversation.unreadCount || 0) > 0;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted border-r-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherParticipant.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium truncate ${
                          hasUnread ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {hasUnread && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Listing info */}
                      {conversation.listing && (
                        <p className="text-xs text-primary mb-1 truncate">
                          {conversation.listing.title} - ${conversation.listing.price}
                        </p>
                      )}

                      {/* Last message */}
                      {conversation.lastMessage && (
                        <p className={`text-sm truncate ${
                          hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                        }`}>
                          {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}

                      {/* Status badge */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(conversation.status)
                        }`}>
                          {conversation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}