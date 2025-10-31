'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  ShoppingCart,
  Heart,
  MessageCircle,
  User,
  Settings,
  Menu,
  Bell,
  LogOut,
  Package,
  Search,
  X,
  CreditCard
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard/buyer',
    icon: LayoutDashboard,
  },
  {
    title: 'My Orders',
    href: '/dashboard/buyer/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Payment Methods',
    href: '/dashboard/buyer/payments',
    icon: CreditCard,
  },
  {
    title: 'Favorites',
    href: '/dashboard/buyer/favorites',
    icon: Heart,
  },
  {
    title: 'Messages',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/dashboard/buyer/settings',
    icon: Settings,
  },
];

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Buyer Dashboard
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopHeader() {
  const { data: session } = useSession();
  const { conversations, unreadMessagesCount, loading: conversationsLoading } = useConversations();
  
  // Mock shopping cart count - in a real app, this would come from a cart context/hook
  const cartItemCount = 2;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    alert('Notifications clicked! (Feature coming soon)');
    console.log('Notifications clicked');
  };

  const handleCartClick = () => {
    // Navigate to orders/cart page
    window.location.href = '/dashboard/buyer/orders';
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
    <div className="flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Buyer Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Messages Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
            >
              <MessageCircle className="h-5 w-5" />
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

        {/* Shopping Cart Button with Badge */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={handleCartClick}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center p-0 text-xs"
            >
              {cartItemCount}
            </Badge>
          )}
          <span className="sr-only">Shopping Cart</span>
        </Button>
        
        <Link href="/games">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Search className="h-4 w-4 mr-2" />
            Browse Listings
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden sm:flex"
          onClick={handleNotificationClick}
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/buyer/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/chat" className="flex items-center">
                <MessageCircle className="mr-2 h-4 w-4" />
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
      </div>
    </div>
  );
}

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 lg:block lg:w-64 lg:fixed lg:inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden ml-4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="flex-1">
              <TopHeader />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}