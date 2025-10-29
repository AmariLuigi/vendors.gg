'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, Search, Shield, LogOut, Settings, MessageSquare, X } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const { conversations, unreadMessagesCount, loading: conversationsLoading } = useConversations();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-24 h-24 relative">
              <Image
                src="/logo.png"
                alt="vendors.gg Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">vendors.gg</span>
              <span className="text-xs text-muted-foreground">Trusted Gaming Marketplace</span>
            </div>
          </Link>
          </motion.div>

          {/* Navigation */}
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center space-x-6"
          >
            <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Link 
                href="/games" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Browse Games
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Link 
                href="/sell" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Start Selling
              </Link>
            </motion.div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Escrow Protected</span>
            </div>
          </motion.nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search items, games, sellers..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Messages Dropdown */}
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {!conversationsLoading && unreadMessagesCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadMessagesCount}
                      </Badge>
                    )}
                    <span className="sr-only">Messages</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 bg-card text-card-foreground shadow-lg border rounded-xl">
                   <div className="flex items-center justify-between p-3 border-b">
                     <h3 className="text-sm font-medium">Messages</h3>
                     <div className="flex items-center space-x-2">
                       <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                         Mark all read
                       </Button>
                       <Button variant="ghost" size="icon" className="h-6 w-6">
                         <X className="w-4 h-4" />
                         <span className="sr-only">Close</span>
                       </Button>
                     </div>
                   </div>
                  <div className="max-h-80 overflow-y-auto">
                    {conversationsLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading messages...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No messages yet
                      </div>
                    ) : (
                      conversations.slice(0, 5).map((conversation) => {
                        const otherUser = conversation.seller; // Assuming current user is buyer
                        const isUnread = (conversation.unreadCount || 0) > 0;
                        
                        return (
                          <Link 
                            key={conversation.id} 
                            href={`/chat?conversation=${conversation.id}`}
                            className="block"
                          >
                            <div className={`p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer ${isUnread ? 'bg-blue-50/50' : ''}`}>
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                  {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium truncate">
                                      {otherUser.firstName} {otherUser.lastName}
                                    </p>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      {conversation.lastMessageAt ? formatTimeAgo(conversation.lastMessageAt) : 'New'}
                                    </span>
                                  </div>
                                  {conversation.listing && (
                                    <p className="text-xs text-muted-foreground mb-1 truncate">
                                      Re: {conversation.listing.title}
                                    </p>
                                  )}
                                  {conversation.lastMessage && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {conversation.lastMessage.content}
                                    </p>
                                  )}
                                  {isUnread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3 border-t">
                    <Link href="/chat">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Messages
                      </Button>
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart */}
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs"
              >
                2
              </Badge>
            </Button>

            {/* Authentication */}
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-muted animate-pulse rounded" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{session.user.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.firstName} {session.user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/chat" className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t py-4 space-y-2">
          <Link 
            href="/games" 
            className="block px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
          >
            Browse Games
          </Link>
          <Link 
            href="/sell" 
            className="block px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
          >
            Start Selling
          </Link>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;