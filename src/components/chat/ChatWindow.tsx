'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, Info, Paperclip, Smile } from 'lucide-react';
import { messagesAPI, conversationsAPI } from '@/lib/api';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachments?: string[];
  isRead: boolean;
  readAt?: string;
  editedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

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
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  onNewMessage: (conversationId: string, message: Message) => void;
  onMarkAsRead: (conversationId: string) => void;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  onNewMessage,
  onMarkAsRead
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when conversation is opened
    if (messages.length > 0 && conversation) {
      markUnreadMessagesAsRead();
      onMarkAsRead(conversationId);
    }
  }, [messages, conversation]);

  const loadConversation = async () => {
    try {
      const response = await conversationsAPI.getById(conversationId);
      if (response.error) {
        setError(response.error);
      } else {
        setConversation(response);
      }
    } catch (err) {
      setError('Failed to load conversation');
      console.error('Error loading conversation:', err);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getByConversation(conversationId);
      
      if (response.error) {
        setError(response.error);
      } else {
        setMessages(response.messages || []);
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markUnreadMessagesAsRead = async () => {
    const unreadMessages = messages.filter(msg => 
      !msg.isRead && msg.senderId !== currentUserId
    );

    for (const message of unreadMessages) {
      try {
        await messagesAPI.markAsRead(message.id);
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await messagesAPI.send({
        conversationId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      if (response.error) {
        setError(response.error);
      } else {
        const message = response.message;
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        onNewMessage(conversationId, message);
        
        // Focus back to input
        inputRef.current?.focus();
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error: {error}</div>
          <button 
            onClick={() => {
              setError(null);
              loadConversation();
              loadMessages();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Conversation not found</div>
      </div>
    );
  }

  const otherParticipant = conversation.buyerId === currentUserId 
    ? conversation.seller 
    : conversation.buyer;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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

            {/* Info */}
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {otherParticipant.firstName} {otherParticipant.lastName}
              </h2>
              {conversation?.listing && (
                <p className="text-sm text-primary">
                  {conversation.listing.title} - ${conversation.listing.price}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
              <Info className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messageGroups.map(({ date, messages: dayMessages }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full">
                {formatMessageDate(date)}
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUserId;
              const showAvatar = index === 0 || dayMessages[index - 1].senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && !isOwnMessage && (
                        message.sender.avatar ? (
                          <img
                            src={message.sender.avatar}
                            alt={`${message.sender.firstName} ${message.sender.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              {message.sender.firstName[0]}{message.sender.lastName[0]}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                        {message.editedAt && ' (edited)'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-border rounded-2xl focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}