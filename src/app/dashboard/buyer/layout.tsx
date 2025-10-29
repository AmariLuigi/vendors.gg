'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  Package
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
    title: 'Favorites',
    href: '/dashboard/buyer/favorites',
    icon: Heart,
  },
  {
    title: 'Messages',
    href: '/dashboard/buyer/messages',
    icon: MessageCircle,
  },
  {
    title: 'Profile',
    href: '/dashboard/buyer/profile',
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
  return (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Buyer Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
          <span className="sr-only">User menu</span>
        </Button>
        
        <Button variant="ghost" size="icon">
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
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