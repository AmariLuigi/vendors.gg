'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home, Search, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-2xl border-0 bg-background/80 backdrop-blur-sm">
          <CardContent className="p-8 lg:p-12">
            <div className="text-center space-y-8">
              {/* Custom 404 Image */}
              <div className="flex justify-center">
                <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                  <Image
                    src="/page not found.png"
                    alt="Page Not Found - Sad Character"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-primary">
                  Oops!
                </h1>
                <h2 className="text-2xl lg:text-3xl font-semibold text-foreground">
                  Page Not Found
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  The page you're looking for seems to have wandered off into the gaming multiverse. 
                  Don't worry though - there are plenty of amazing items waiting for you in our marketplace!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Home className="mr-2 w-5 h-5" />
                    Back to Home
                  </Button>
                </Link>
                
                <Link href="/games">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Search className="mr-2 w-5 h-5" />
                    Browse Marketplace
                  </Button>
                </Link>
              </div>

              {/* Additional Help */}
              <div className="pt-8 border-t border-border/50">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Need Help?
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                    <Link 
                      href="/" 
                      className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="mr-1 w-4 h-4" />
                      Go back to previous page
                    </Link>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <Link 
                      href="/contact" 
                      className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="mr-1 w-4 h-4" />
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>

              {/* Popular Links */}
              <div className="pt-6">
                <h4 className="text-md font-medium text-foreground mb-4">
                  Popular Destinations
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link href="/games/counter-strike">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Counter-Strike Items
                    </Button>
                  </Link>
                  <Link href="/games/valorant">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Valorant Accounts
                    </Button>
                  </Link>
                  <Link href="/games/league-of-legends">
                    <Button variant="ghost" size="sm" className="text-xs">
                      League of Legends
                    </Button>
                  </Link>
                  <Link href="/sell">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Start Selling
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}