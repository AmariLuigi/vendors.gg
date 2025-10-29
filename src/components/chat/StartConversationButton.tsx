'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send } from 'lucide-react';
import { conversationsAPI } from '@/lib/api';

interface StartConversationButtonProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
  className?: string;
  variant?: 'button' | 'icon';
  onConversationCreated?: (conversationId: string) => void;
}

export function StartConversationButton({
  listingId,
  sellerId,
  listingTitle,
  className = '',
  variant = 'button',
  onConversationCreated
}: StartConversationButtonProps) {
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  // Don't render if user is not authenticated
  if (!session?.user) {
    return null;
  }

  const handleStartConversation = async (message?: string) => {
    if (isCreating || !session?.user) return;

    try {
      setIsCreating(true);
      
      const response = await conversationsAPI.create({
        sellerId,
        listingId,
        initialMessage: message || `Hi! I'm interested in your listing: ${listingTitle}`
      });

      if (response.error) {
        alert('Failed to start conversation: ' + response.error);
      } else {
        // Redirect to chat page or call callback
        if (onConversationCreated) {
          onConversationCreated(response.conversation.id);
        } else {
          window.location.href = `/chat?conversation=${response.conversation.id}`;
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsCreating(false);
      setShowMessageInput(false);
      setInitialMessage('');
    }
  };

  const handleQuickStart = () => {
    handleStartConversation();
  };

  const handleCustomMessage = () => {
    setShowMessageInput(true);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialMessage.trim()) {
      handleStartConversation(initialMessage.trim());
    }
  };

  if (showMessageInput) {
    return (
      <div className="space-y-3">
        <form onSubmit={handleSendCustomMessage} className="space-y-3">
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder={`Send a message about "${listingTitle}"...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={!initialMessage.trim() || isCreating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {isCreating ? 'Sending...' : 'Send Message'}
            </button>
            <button
              type="button"
              onClick={() => setShowMessageInput(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleQuickStart}
        disabled={isCreating}
        className={`p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Message Seller"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleQuickStart}
        disabled={isCreating}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {isCreating ? 'Starting...' : 'Message Seller'}
      </button>
      
      <button
        onClick={handleCustomMessage}
        disabled={isCreating}
        className="w-full text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send custom message
      </button>
    </div>
  );
}