'use client';

import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConversations } from '@/hooks/useConversations';
import Link from 'next/link';

interface ChatNotificationsProps {
  className?: string;
}

export function ChatNotifications({ className = '' }: ChatNotificationsProps) {
  const { conversations, unreadMessagesCount } = useConversations();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2">
            <MessageCircle className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-80 p-0 bg-card text-card-foreground shadow-lg border rounded-xl"
        >
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Messages</h3>
            <div className="flex items-center space-x-2">
              {unreadMessagesCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  Mark all read
                </Button>
              )}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            </div>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No messages yet
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {conversations.slice(0, 5).map((conversation) => {
                const otherUser = conversation.buyer?.id !== conversation.sellerId 
                  ? conversation.buyer 
                  : conversation.seller;
                const displayName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Unknown User';
                const avatarUrl = otherUser?.avatar;
                
                return (
                  <Link 
                    key={conversation.id} 
                    href={`/chat?conversation=${conversation.id}`}
                    className="block"
                  >
                    <div className={`p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                      (conversation.unreadCount || 0) > 0 ? 'bg-blue-50/50' : ''
                    }`}>
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {displayName}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTimeAgo(conversation.lastMessageAt || conversation.createdAt)}
                            </span>
                          </div>
                          
                          {conversation.listing?.title && (
                            <p className="text-xs text-muted-foreground mb-1 truncate">
                              Re: {conversation.listing.title}
                            </p>
                          )}
                          
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          
                          {(conversation.unreadCount || 0) > 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          <div className="p-3 border-t">
            <Link href="/chat">
              <Button variant="outline" size="sm" className="w-full">
                View All Messages
              </Button>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}