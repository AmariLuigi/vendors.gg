'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VendorLogo from '@/components/ui/vendor-logo';
import { ShoppingCart, User, Search, Shield } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <VendorLogo size="md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">vendors.gg</span>
              <span className="text-xs text-muted-foreground">Trusted Gaming Marketplace</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/games" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Browse Games
            </Link>
            <Link 
              href="/sell" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Start Selling
            </Link>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Escrow Protected</span>
            </div>
          </nav>

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

            {/* Auth Buttons */}
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

            {/* User Menu (when logged in) */}
            {/* <Button variant="ghost" size="sm" className="hidden">
              <User className="w-5 h-5" />
            </Button> */}

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
    </header>
  );
};

export default Header;